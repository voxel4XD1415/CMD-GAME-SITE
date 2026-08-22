const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT = __dirname;
const PUBLIC_FOLDER = path.join(ROOT, "public");
const GAMES_FOLDER = path.join(ROOT, "games");

if (!fs.existsSync(GAMES_FOLDER)) {
    fs.mkdirSync(GAMES_FOLDER, { recursive: true });
}

app.use(express.static(PUBLIC_FOLDER));

function scanGames() {
    const result = [];
    const folders = fs.readdirSync(GAMES_FOLDER, { withFileTypes: true });

    for (const folder of folders) {
        if (!folder.isDirectory()) continue;

        const gameName = folder.name;
        const gameFolder = path.join(GAMES_FOLDER, gameName);
        const files = fs.readdirSync(gameFolder);

        let cover = null;
        for (const coverName of ["cover.png", "cover.jpg", "cover.jpeg", "icon.png", "icon.jpg"]) {
            if (files.includes(coverName)) {
                cover = "/games/" + encodeURIComponent(gameName) + "/" + encodeURIComponent(coverName);
                break;
            }
        }

        let downloadFile = null;
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if ([".zip", ".exe", ".7z", ".rar"].includes(ext)) {
                downloadFile = file;
                break;
            }
        }

        let type = "OTHER";
        if (downloadFile) {
            const ext = path.extname(downloadFile).toLowerCase();
            if (ext === ".exe") type = "WINDOWS";
            else if (ext === ".zip") type = "ZIP";
            else if (ext === ".rar") type = "RAR";
            else if (ext === ".7z") type = "7Z";
        }

        const displayName = gameName
            .replace(/[-_]/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase());

        result.push({
            id: gameName,
            title: displayName,
            type,
            cover,
            file: downloadFile,
            download: downloadFile ? "/download/" + encodeURIComponent(gameName) : null
        });
    }

    return result;
}

app.get("/api/games", (req, res) => {
    try {
        res.json(scanGames());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to scan games" });
    }
});

app.get("/download/:game", (req, res) => {
    try {
        const gameName = path.basename(req.params.game);
        const gameFolder = path.join(GAMES_FOLDER, gameName);

        if (!fs.existsSync(gameFolder)) return res.status(404).send("Game not found.");

        const files = fs.readdirSync(gameFolder);
        const downloadFile = files.find(file =>
            [".zip", ".exe", ".7z", ".rar"].includes(path.extname(file).toLowerCase())
        );

        if (!downloadFile) return res.status(404).send("Download file not found.");

        const filePath = path.join(gameFolder, downloadFile);
        if (!fs.existsSync(filePath)) return res.status(404).send("File not found.");

        console.log(`DOWNLOAD: ${gameName} -> ${downloadFile}`);
        res.download(filePath, downloadFile);
    } catch (error) {
        console.error(error);
        res.status(500).send("Download error.");
    }
});

app.use("/games", express.static(GAMES_FOLDER));

app.listen(PORT, () => {
    console.log("");
    console.log("======================================");
    console.log("          CMD GAME SITE");
    console.log("======================================");
    console.log("");
    console.log(`Website: http://localhost:${PORT}`);
    console.log(`Games folder: ${GAMES_FOLDER}`);
    console.log("");
    console.log("SERVER IS RUNNING!");
    console.log("");
});