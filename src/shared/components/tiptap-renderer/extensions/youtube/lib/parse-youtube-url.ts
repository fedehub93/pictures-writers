export const getYouTubeVideoId = (src: string): string | null => {
  let url: URL;

  try {
    url = new URL(src.startsWith("//") ? `https:${src}` : src);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    return url.pathname.split("/")[1] || null;
  }

  if (
    host !== "youtube.com" &&
    host !== "youtube-nocookie.com" &&
    host !== "m.youtube.com" &&
    host !== "music.youtube.com"
  ) {
    return null;
  }

  if (url.pathname.startsWith("/embed/")) {
    const id = url.pathname.split("/")[2];
    return id && id !== "videoseries" ? id : null;
  }

  if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/")) {
    return url.pathname.split("/")[2] || null;
  }

  return url.searchParams.get("v");
};

export const getYouTubeEmbedUrl = (
  src: string,
  start?: number | string,
): string | null => {
  const videoId = getYouTubeVideoId(src);
  if (!videoId) return null;

  const params = new URLSearchParams({ autoplay: "1" });
  if (start) params.set("start", String(start));

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};
