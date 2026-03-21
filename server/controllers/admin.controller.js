module.exports = ({
    fs,
    path,
    baseDir
}) => ({
    getLogs: (req, res) => {
        try {
            const typeAliases = {
                http: 'http-requests.log',
                auth: 'authentication.log',
                audit: 'audit.log',
                error: 'errors.log'
            };
            const requestedType = String(req.query.type || '').trim();
            const search = String(req.query.search || '').trim().toLowerCase();
            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

            let targetFiles;
            if (!requestedType) {
                targetFiles = Object.values(typeAliases);
            } else if (typeAliases[requestedType]) {
                targetFiles = [typeAliases[requestedType]];
            } else if (requestedType === path.basename(requestedType) && !requestedType.includes('..')) {
                targetFiles = [requestedType];
            } else {
                return res.status(400).json({ success: false, message: 'Invalid log type' });
            }

            const logs = [];

            for (const filename of targetFiles) {
                const logPath = path.join(baseDir, 'logs', filename);
                if (!fs.existsSync(logPath)) continue;

                const content = fs.readFileSync(logPath, 'utf-8');
                const entries = content.split('\n')
                    .filter(line => line.trim())
                    .map(line => {
                        try {
                            return JSON.parse(line);
                        } catch (e) {
                            return null;
                        }
                    })
                    .filter(Boolean)
                    .map(entry => ({
                        ...entry,
                        type: entry.type || filename.replace(/\.log$/i, '')
                    }));

                logs.push(...entries);
            }

            const filteredLogs = search
                ? logs.filter((entry) => JSON.stringify(entry).toLowerCase().includes(search))
                : logs;

            filteredLogs.sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));

            const total = filteredLogs.length;
            const start = (page - 1) * limit;
            const pagedLogs = filteredLogs.slice(start, start + limit);

            res.json({ success: true, logs: pagedLogs, total, page, limit });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error reading logs' });
        }
    }
});
