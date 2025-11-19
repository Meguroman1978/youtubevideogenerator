import express from 'express';
import { SchedulerService } from '../services/scheduler.service.js';
import type { ScheduleConfig } from '../types/index.js';

const router = express.Router();

// Initialize scheduler service (will be set up in index.ts)
let schedulerService: SchedulerService | null = null;

export function initializeScheduler(service: SchedulerService) {
  schedulerService = service;
}

export function getSchedulerService(): SchedulerService | null {
  return schedulerService;
}

// Create a new schedule
router.post('/create', async (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const config: ScheduleConfig = req.body;

    // Validate required fields
    if (!config.spreadsheetId || !config.scheduleTime) {
      return res.status(400).json({ 
        error: 'spreadsheetId and scheduleTime are required' 
      });
    }

    const jobId = schedulerService.createJob(config);
    
    res.json({ 
      success: true, 
      jobId,
      message: 'Schedule created successfully' 
    });
  } catch (error: any) {
    console.error('Failed to create schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all schedules
router.get('/list', (_req, res) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const jobs = schedulerService.getAllJobs();
    res.json({ jobs });
  } catch (error: any) {
    console.error('Failed to list schedules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific schedule
router.get('/:jobId', (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { jobId } = req.params;
    const job = schedulerService.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ job });
  } catch (error: any) {
    console.error('Failed to get schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a schedule
router.put('/:jobId', async (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { jobId } = req.params;
    const config: ScheduleConfig = req.body;

    const success = schedulerService.updateJob(jobId, config);

    if (!success) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ success: true, message: 'Schedule updated successfully' });
  } catch (error: any) {
    console.error('Failed to update schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a schedule
router.delete('/:jobId', (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { jobId } = req.params;
    const success = schedulerService.deleteJob(jobId);

    if (!success) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pause a schedule
router.post('/:jobId/pause', (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { jobId } = req.params;
    const success = schedulerService.pauseJob(jobId);

    if (!success) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ success: true, message: 'Schedule paused successfully' });
  } catch (error: any) {
    console.error('Failed to pause schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume a schedule
router.post('/:jobId/resume', (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { jobId } = req.params;
    const success = schedulerService.resumeJob(jobId);

    if (!success) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({ success: true, message: 'Schedule resumed successfully' });
  } catch (error: any) {
    console.error('Failed to resume schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute a schedule manually (for testing)
router.post('/:jobId/execute', async (req, res) => {
  try {
    if (!schedulerService) {
      return res.status(500).json({ error: 'Scheduler service not initialized' });
    }

    const { jobId } = req.params;
    await schedulerService.executeJobManually(jobId);

    res.json({ success: true, message: 'Schedule executed successfully' });
  } catch (error: any) {
    console.error('Failed to execute schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
