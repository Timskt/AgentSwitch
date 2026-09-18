import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

if (process.platform === "darwin") {
  try {
    const electronPkgDir = path.dirname(require.resolve("electron/package.json"));
    const distDir = path.join(electronPkgDir, "dist");
    const oldApp = path.join(distDir, "Electron.app");
    const newApp = path.join(distDir, "AgentSwitch.app");

    if (fs.existsSync(oldApp) && !fs.existsSync(newApp)) {
      fs.renameSync(oldApp, newApp);
      try {
        fs.symlinkSync("AgentSwitch.app", oldApp);
      } catch (e) {}
    }

    const targetApp = fs.existsSync(newApp) ? newApp : oldApp;
    const macosDir = path.join(targetApp, "Contents", "MacOS");
    const oldExe = path.join(macosDir, "Electron");
    const newExe = path.join(macosDir, "AgentSwitch");

    if (fs.existsSync(oldExe) && !fs.existsSync(newExe)) {
      fs.renameSync(oldExe, newExe);
      try {
        fs.symlinkSync("AgentSwitch", oldExe);
      } catch (e) {}
    }

    const plistPath = path.join(targetApp, "Contents", "Info.plist");
    if (fs.existsSync(plistPath)) {
      const commands = [
        `/usr/libexec/PlistBuddy -c "Set :CFBundleName AgentSwitch" "${plistPath}" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleName string AgentSwitch" "${plistPath}"`,
        `/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName AgentSwitch" "${plistPath}" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleDisplayName string AgentSwitch" "${plistPath}"`,
        `/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable AgentSwitch" "${plistPath}" 2>/dev/null || /usr/libexec/PlistBuddy -c "Add :CFBundleExecutable string AgentSwitch" "${plistPath}"`
      ];
      for (const cmd of commands) {
        try {
          execSync(cmd, { stdio: "ignore" });
        } catch (e) {}
      }
    }

    const zhStrings = path.join(targetApp, "Contents", "Resources", "zh_CN.lproj", "InfoPlist.strings");
    fs.mkdirSync(path.dirname(zhStrings), { recursive: true });
    fs.writeFileSync(zhStrings, '"CFBundleDisplayName" = "AgentSwitch";\n"CFBundleName" = "AgentSwitch";\n');

    const enStrings = path.join(targetApp, "Contents", "Resources", "en.lproj", "InfoPlist.strings");
    fs.mkdirSync(path.dirname(enStrings), { recursive: true });
    fs.writeFileSync(enStrings, '"CFBundleDisplayName" = "AgentSwitch";\n"CFBundleName" = "AgentSwitch";\n');

    const pathTxt = path.join(electronPkgDir, "path.txt");
    fs.writeFileSync(pathTxt, "AgentSwitch.app/Contents/MacOS/AgentSwitch");

    try {
      execSync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "${targetApp}"`, { stdio: "ignore" });
    } catch (e) {}

    console.log("✔ Successfully configured macOS dev bundle as AgentSwitch");
  } catch (err) {
    console.warn("Could not update Electron bundle:", err.message);
  }
}
