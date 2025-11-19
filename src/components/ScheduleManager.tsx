import { useState, useEffect } from 'react';
import type { ScheduleConfig } from '../types';

interface ScheduledJob {
  id: string;
  config: ScheduleConfig;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'error';
}

export function ScheduleManager() {
  const [schedules, setSchedules] = useState<ScheduledJob[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/scheduler/list');
      if (response.ok) {
        const data = await response.json();
        setSchedules(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!spreadsheetId.trim()) {
      setError('❌ Google Sheet IDを入力してください');
      return;
    }

    try {
      const config: ScheduleConfig = {
        spreadsheetId: spreadsheetId.trim(),
        scheduleTime,
        dayOfWeek: selectedDays.length > 0 ? selectedDays : undefined,
        enabled,
      };

      const response = await fetch('/api/scheduler/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMsg = data.error || data.message || '不明なエラー';
        const statusText = response.statusText || '';
        throw new Error(`${errorMsg} (ステータス: ${response.status} ${statusText})`);
      }

      const result = await response.json();
      setSuccess(`✅ スケジュールを作成しました！ ID: ${result.jobId || 'N/A'}`);
      setSpreadsheetId('');
      setScheduleTime('09:00');
      setSelectedDays([]);
      setEnabled(true);
      setIsCreating(false);
      
      await loadSchedules();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Create schedule error:', err);
      setError(`❌ スケジュール作成エラー: ${err.message || 'Unknown error'}。Google Sheets APIの認証が完了していることを確認してください。`);
    }
  };

  const handleToggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handlePauseResume = async (jobId: string, currentStatus: string) => {
    setError(null);
    try {
      const action = currentStatus === 'active' ? 'pause' : 'resume';
      const response = await fetch(`/api/scheduler/${jobId}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `${action === 'pause' ? '一時停止' : '再開'}に失敗しました (ステータス: ${response.status})`);
      }

      setSuccess(`✅ スケジュールを${action === 'pause' ? '一時停止' : '再開'}しました`);
      setTimeout(() => setSuccess(null), 3000);
      await loadSchedules();
    } catch (err: any) {
      console.error('Pause/Resume error:', err);
      setError(`❌ エラー: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('このスケジュールを削除しますか？')) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/scheduler/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `削除に失敗しました (ステータス: ${response.status})`);
      }

      setSuccess('✅ スケジュールを削除しました');
      setTimeout(() => setSuccess(null), 3000);
      await loadSchedules();
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(`❌ 削除エラー: ${err.message || 'Unknown error'}。ページをリロードしてから再試行してください。`);
    }
  };

  const handleExecuteNow = async (jobId: string) => {
    setError(null);
    setSuccess(null);
    
    try {
      setSuccess('🔄 実行中...');
      const response = await fetch(`/api/scheduler/${jobId}/execute`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.message || '実行に失敗しました';
        throw new Error(errorMsg);
      }

      const result = await response.json();
      setSuccess(`✅ スケジュールを手動実行しました！ ${result.message || ''}`);
      setTimeout(() => setSuccess(null), 5000);
      await loadSchedules();
    } catch (err: any) {
      console.error('Execute error:', err);
      setError(`❌ 実行エラー: ${err.message || 'Unknown error'}。詳細はブラウザのコンソールをご確認ください。`);
      setTimeout(() => setError(null), 10000);
    }
  };

  return (
    <div className="schedule-manager">
      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>⏰ 自動実行スケジュール</h2>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Google Sheetsから自動的にキーワードを取得して動画生成を実行するスケジュールを設定できます。
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '1rem', whiteSpace: 'pre-wrap' }}>
            {error}
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              💡 トラブルシューティング:
              <ul style={{ marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                <li>Google Sheets APIが認証されているか確認してください（API設定画面）</li>
                <li>Google Sheet IDが正しいか確認してください</li>
                <li>ブラウザのコンソール（F12）で詳細なエラーログを確認できます</li>
                <li>問題が続く場合は、ページをリロードしてください</li>
              </ul>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem', padding: '1rem' }}>
            {success}
          </div>
        )}

        {!isCreating ? (
          <button
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
            style={{ marginBottom: '2rem' }}
          >
            ➕ 新しいスケジュールを作成
          </button>
        ) : (
          <form onSubmit={handleCreateSchedule} style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '0.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>新規スケジュール作成</h3>

            <div className="input-group">
              <label htmlFor="spreadsheetId">Google Sheet ID *</label>
              <input
                id="spreadsheetId"
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="例: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                required
              />
              <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                Google SheetsのURLから取得してください
              </small>
            </div>

            <div className="input-group">
              <label htmlFor="scheduleTime">実行時刻 *</label>
              <input
                id="scheduleTime"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div className="input-group">
              <label>実行曜日（未選択の場合は毎日）</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {dayNames.map((day, index) => (
                  <label
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.5rem 1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: selectedDays.includes(index) ? 'var(--primary-color)' : 'transparent',
                      color: selectedDays.includes(index) ? 'white' : 'var(--text-color)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(index)}
                      onChange={() => handleToggleDay(index)}
                      style={{ display: 'none' }}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={{ width: 'auto', marginRight: '0.5rem' }}
                />
                スケジュールを有効にする
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                作成
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setIsCreating(false);
                  setError(null);
                }}
                style={{ backgroundColor: 'var(--bg-color)' }}
              >
                キャンセル
              </button>
            </div>
          </form>
        )}

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>登録済みスケジュール</h3>

        {schedules.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            スケジュールが登録されていません
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  backgroundColor: schedule.status === 'active' ? 'transparent' : 'var(--bg-color)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>
                      {schedule.status === 'active' ? '🟢' : schedule.status === 'paused' ? '⏸️' : '🔴'}{' '}
                      Sheet: {schedule.config.spreadsheetId.substring(0, 20)}...
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                      ⏰ {schedule.config.scheduleTime}
                      {schedule.config.dayOfWeek && schedule.config.dayOfWeek.length > 0 && (
                        <span> ({schedule.config.dayOfWeek.map(d => dayNames[d]).join(', ')})</span>
                      )}
                      {(!schedule.config.dayOfWeek || schedule.config.dayOfWeek.length === 0) && (
                        <span> (毎日)</span>
                      )}
                    </p>
                    {schedule.lastRun && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                        前回実行: {new Date(schedule.lastRun).toLocaleString('ja-JP')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`status-badge ${
                      schedule.status === 'active' ? 'status-completed' :
                      schedule.status === 'paused' ? 'status-pending' :
                      'status-failed'
                    }`}
                  >
                    {schedule.status === 'active' ? '実行中' : schedule.status === 'paused' ? '一時停止' : 'エラー'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handlePauseResume(schedule.id, schedule.status)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    {schedule.status === 'active' ? '⏸️ 一時停止' : '▶️ 再開'}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleExecuteNow(schedule.id)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    🚀 今すぐ実行
                  </button>
                  <button
                    className="btn"
                    onClick={() => handleDelete(schedule.id)}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: '#ef4444', color: 'white' }}
                  >
                    🗑️ 削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
