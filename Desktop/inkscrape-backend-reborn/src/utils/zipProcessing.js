const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const ApiError = require("../errors/ApiError");

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "ignore" });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function escapePowerShellLiteral(input) {
  return String(input).replace(/'/g, "''");
}

async function extractZipToTempDirectory(zipFilePath) {
  const tempDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "inkscape-scan-zip-"));

  try {
    if (process.platform === "win32") {
      const script = `Expand-Archive -LiteralPath '${escapePowerShellLiteral(zipFilePath)}' -DestinationPath '${escapePowerShellLiteral(tempDirectory)}' -Force`;
      await runCommand("powershell.exe", ["-NoProfile", "-Command", script]);
    } else {
      await runCommand("unzip", ["-qq", zipFilePath, "-d", tempDirectory]);
    }

    return tempDirectory;
  } catch (_error) {
    await deleteTempDirectory(tempDirectory);
    throw new ApiError(400, "INVALID_ZIP", "Unable to extract zip archive.");
  }
}

async function collectFilesRecursively(rootPath) {
  const entries = await fs.promises.readdir(rootPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootPath, entry.name);

    if (entry.isDirectory()) {
      const nested = await collectFilesRecursively(fullPath);
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function deleteTempDirectory(directoryPath) {
  if (!directoryPath) {
    return;
  }

  try {
    await fs.promises.rm(directoryPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to delete temp directory ${directoryPath}: ${error.message}`);
  }
}

function validateZipUpload(zipFile) {
  if (!zipFile) {
    return;
  }

  const fileName = String(zipFile.originalname || "").toLowerCase();
  const mimeType = String(zipFile.mimetype || "").toLowerCase();
  const looksLikeZip = fileName.endsWith(".zip") || mimeType.includes("zip");

  if (!looksLikeZip) {
    throw new ApiError(400, "INVALID_ZIP", "zip field must contain a zip archive.");
  }
}

function toPortablePath(value) {
  return String(value).split(path.sep).join("/");
}

module.exports = {
  extractZipToTempDirectory,
  collectFilesRecursively,
  deleteTempDirectory,
  validateZipUpload,
  toPortablePath
};
