import { videosData as defaultVideos, type VideoEntry } from "@/data/videos_data";

const STORAGE_KEY = "videosData";

export function getStoredVideos(): VideoEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...defaultVideos];
}

export function saveVideos(videos: VideoEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
}

export function addVideo(video: VideoEntry) {
  const videos = getStoredVideos();
  videos.push(video);
  saveVideos(videos);
  return videos;
}

export function deleteVideo(index: number) {
  const videos = getStoredVideos();
  videos.splice(index, 1);
  saveVideos(videos);
  return videos;
}
