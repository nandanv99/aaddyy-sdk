import type { AADDYY } from '../client.js';
import { AADDYYError, toolUnavailable } from '../errors.js';
import { rename, toBody } from '../params.js';

export type EduClipDuration = 15 | 30 | 45 | 60;
export type EduClipAspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | '3:4' | '9:16';
export type EduClipStyle = '2d-cartoon' | '3d-cartoon' | 'realistic' | 'watercolor' | 'whiteboard';

/** POST /api/ai/edu-clip-generator */
export interface EduClipParams {
  /** What the clip explains, and for whom (5-1000 characters). */
  userInput: string;
  /** The clip's length in seconds. The price depends on it. */
  duration: EduClipDuration;
  /** Default '16:9'. */
  aspectRatio?: EduClipAspectRatio;
  /** Default '2d-cartoon'. */
  videoStyle?: EduClipStyle;
}

/** The 1.0.2 parameter name for `videos.eduClip()`. */
export interface LegacyEduClipParams extends Omit<EduClipParams, 'userInput'> {
  /** @deprecated Use `userInput`. */
  topic: string;
}

/** A clip job, as GET /api/ai/edu-clip-generator/status/:jobId returns it. */
export interface EduClipJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  topic?: string;
  progress?: number;
  current_step?: string;
  duration?: number;
  aspect_ratio?: string;
  video_style?: string;
  total_scenes?: number;
  completed_scenes?: number;
  estimated_cost?: number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  processing_time?: number;
  /**
   * When the clip is ready: the MP4's path on the API host, such as
   * /api/ai/edu-clip-generator/download/<job_id>. Download it with the same
   * Authorization header.
   */
  download_url?: string;
  video_duration?: number;
  video_size?: number;
  error?: string;
}

/** @deprecated `videos.generate()` rejects: its tool is switched off. */
export interface VideoGenerateParams {
  prompt: string;
  aspect_ratio?: string;
  duration?: number;
}

/** @deprecated `videos.audioToVideo()` rejects: its tool is switched off. */
export interface AudioToVideoParams {
  audioUrl: string;
  style?: string;
}

const EDU_CLIP_POLL_MS = 5_000;
const EDU_CLIP_TIMEOUT_MS = 30 * 60_000;

export class Videos {
  constructor(private client: AADDYY) {}

  /**
   * @deprecated The AI Video Generator tool is switched off. This method
   * rejects with an AADDYYError (code TOOL_UNAVAILABLE) and sends no request.
   */
  async generate(_params: VideoGenerateParams): Promise<unknown> {
    throw toolUnavailable('videos.generate()', 'AI Video Generator');
  }

  /**
   * @deprecated The AI Audio to Video tool is switched off. This method
   * rejects with an AADDYYError (code TOOL_UNAVAILABLE) and sends no request.
   */
  async audioToVideo(_params: AudioToVideoParams): Promise<unknown> {
    throw toolUnavailable('videos.audioToVideo()', 'AI Audio to Video');
  }

  /**
   * Make a short educational video. Starts the clip (POST
   * /api/ai/edu-clip-generator), then polls its status every 5 seconds until
   * it is ready (up to 30 minutes). Resolves to the finished job, whose
   * `download_url` is the MP4. Rejects with code JOB_FAILED if the clip fails,
   * or JOB_TIMEOUT if it is not ready in time (it may still finish).
   */
  async eduClip(params: EduClipParams | LegacyEduClipParams): Promise<EduClipJob> {
    const body = toBody(params);
    rename(body, 'topic', 'userInput');

    const started = await this.client._request<{ job_id?: string } | null>('POST', '/ai/edu-clip-generator', body);
    if (!started || !started.job_id) {
      throw new AADDYYError({ error: { message: 'The clip was not started: the response has no job_id.', code: 'BAD_RESPONSE' } });
    }
    const jobId = String(started.job_id);
    const statusPath = `/ai/edu-clip-generator/status/${encodeURIComponent(jobId)}`;

    const begin = Date.now();
    while (Date.now() - begin < EDU_CLIP_TIMEOUT_MS) {
      await this.client._sleep(EDU_CLIP_POLL_MS);
      const job = await this.client._request<EduClipJob>('GET', statusPath);
      if (job.status === 'completed') return job;
      if (job.status === 'failed') {
        throw new AADDYYError({
          error: { message: job.error || 'The clip could not be made.', code: 'JOB_FAILED', details: { jobId } },
        });
      }
    }

    throw new AADDYYError({
      error: {
        message: `Clip ${jobId} was not ready after ${EDU_CLIP_TIMEOUT_MS / 60_000} minutes. ` +
          `It may still finish: poll GET /api${statusPath}.`,
        code: 'JOB_TIMEOUT',
        details: { jobId },
      },
    });
  }
}
