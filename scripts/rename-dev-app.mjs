import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

if (process.platform === "darwin") {
  try {
    const electronBinary = require("electron");
    const appDir = path.resolve(electronBinary, "../../..");
    const plistPath = path.join(appDir, "Contents", "Info.plist");

    if (fs.existsSync(plistPath)) {
      const commands = [
        `/usr/libexec/PlistBuddy -c "Set :CFBundleName AgentSwitch" "${plistPath}" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleName string AgentSwitch" "${plistPath}"`,
        `/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName AgentSwitch" "${plistPath}" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string AgentSwitch" "${plistPath}"`
      ];
      for (const cmd of commands) {
        execSync(cmd, { stdio: "ignore" });
      }
      console.log("✔ Successfully set dev Electron app name to AgentSwitch");
    }
  } catch (err) {
    console.warn("Could not update Electron Info.plist:", err.message);
  }
}
