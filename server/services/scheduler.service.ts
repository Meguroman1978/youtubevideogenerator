import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import type { ScheduleConfig } from '../types/index.js';

interface ScheduledJob {
  id: string;
  config: ScheduleConfig;
  task: cron.ScheduledTask | null;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error';
}

export class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private configPath: string;
  private onJobExecute?: (spreadsheetId: string) => Promise<void>;

  constructor(configPath: string = path.join(process.cwd(), 'scheduler-config.json')) {
    this.configPath = configPath;
    this.loadSchedules();
  }

  // Set callback function for when a job executes
  setJobExecuteCallback(callback: (spreadsheetId: string) => Promise<void>) {
    this.onJobExecute = callback;
  }

  // Load schedules from file
  private loadSchedules() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const configs: ScheduleConfig[] = JSON.parse(data);
        
        configs.forEach(config => {
          if (config.enabled) {
            this.createJob(config);
          }
        });
        
        console.log(`📅 Loaded ${configs.length} schedule(s)`);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    }
  }

  // Save schedules to file
  private saveSchedules() {
    try {
      const configs: ScheduleConfig[] = Array.from(this.jobs.values()).map(job => job.config);
      fs.writeFileSync(this.configPath, JSON.stringify(configs, null, 2));
    } catch (error) {
      console.error('Failed to save schedules:', error);
    }
  }

  // Create a new scheduled job
  createJob(config: ScheduleConfig): string {
    const jobId = `${config.spreadsheetId}-${Date.now()}`;
    
    // Validate cron expression or convert time format
    const cronExpression = this.convertToCron(config.scheduleTime, config.dayOfWeek);
    
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    const task = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Scheduled job executing: ${jobId}`);
      const job = this.jobs.get(jobId);
      if (job) {
        job.lastRun = new Date().toISOString();
        if (this.onJobExecute) {
          try {
            await this.onJobExecute(config.spreadsheetId);
          } catch (error) {
            console.error(`Job execution failed for ${jobId}:`, error);
            job.status = 'error';
          }
        }
      }
    }, {
      timezone: 'Asia/Tokyo',
    });

    // Start or stop task based on enabled flag
    if (config.enabled) {
      task.start();
    } else {
      task.stop();
    }

    const scheduledJob: ScheduledJob = {
      id: jobId,
      config,
      task,
      status: config.enabled ? 'active' : 'paused',
      nextRun: this.getNextRunTime(cronExpression),
    };

    this.jobs.set(jobId, scheduledJob);
    this.saveSchedules();
    
    console.log(`✅ Created scheduled job: ${jobId} (${cronExpression})`);
    return jobId;
  }

  // Convert schedule time to cron expression
  private convertToCron(scheduleTime: string, dayOfWeek?: number[]): string {
    // If already a cron expression, validate and return
    if (scheduleTime.split(' ').length >= 5) {
      return scheduleTime;
    }

    // Parse time format "HH:MM"
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error(`Invalid time format: ${scheduleTime}. Use HH:MM or cron expression.`);
    }

    // Build cron expression: minute hour * * day
    const dayPart = dayOfWeek && dayOfWeek.length > 0 
      ? dayOfWeek.join(',') 
      : '*';
    
    return `${minutes} ${hours} * * ${dayPart}`;
  }

  // Get next run time for a cron expression
  private getNextRunTime(cronExpression: string): string {
    try {
      // Note: node-cron doesn't provide direct next run time access
      // This is a placeholder - in production, use a library like cron-parser
      return `Scheduled: ${cronExpression}`;
    } catch (error) {
      return 'Unknown';
    }
  }

  // Update an existing job
  updateJob(jobId: string, config: ScheduleConfig): boolean {
    const existingJob = this.jobs.get(jobId);
    if (!existingJob) {
      return false;
    }

    // Stop existing task
    if (existingJob.task) {
      existingJob.task.stop();
    }

    // Remove old job
    this.jobs.delete(jobId);

    // Create new job with updated config
    this.createJob(config);
    return true;
  }

  // Delete a job
  deleteJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.task) {
      job.task.stop();
    }

    this.jobs.delete(jobId);
    this.saveSchedules();
    
    console.log(`🗑️  Deleted scheduled job: ${jobId}`);
    return true;
  }

  // Pause a job
  pauseJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || !job.task) {
      return false;
    }

    job.task.stop();
    job.status = 'paused';
    job.config.enabled = false;
    this.saveSchedules();
    
    console.log(`⏸️  Paused scheduled job: ${jobId}`);
    return true;
  }

  // Resume a job
  resumeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || !job.task) {
      return false;
    }

    job.task.start();
    job.status = 'active';
    job.config.enabled = true;
    this.saveSchedules();
    
    console.log(`▶️  Resumed scheduled job: ${jobId}`);
    return true;
  }

  // Get all jobs
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map(job => ({
      ...job,
      task: null, // Don't serialize the task object
    }));
  }

  // Get job by ID
  getJob(jobId: string): ScheduledJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    
    return {
      ...job,
      task: null, // Don't serialize the task object
    };
  }

  // Execute a job manually (for testing)
  async executeJobManually(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    console.log(`🔧 Manually executing job: ${jobId}`);
    
    if (this.onJobExecute) {
      await this.onJobExecute(job.config.spreadsheetId);
      job.lastRun = new Date().toISOString();
    }
  }
}
