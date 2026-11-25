import { Config } from "@remotion/cli/config";

// Screen recordings are 60fps H.264; keep the master crisp.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
