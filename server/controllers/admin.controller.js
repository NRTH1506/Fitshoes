module.exports = ({
    fs,
    path,
    baseDir
}) => ({
    getLogs: (req, res) => {
        const logType = String(req.query.type || '').trim();
        if (!logType) return res.status(400).json({ success: false, message: 'Log type required' });
        if (logType !== path.basename(logType) || logType.includes('..')) {
            return res.status(400).json({ success: false, message: 'Invalid log type' });
        }

        const logPath = path.join(baseDir, 'logs', logType);
        if (!fs.existsSync(logPath)) {
            return res.status(404).json({ success: false, message: 'Log file not found' });
        }

        try {
            const content = fs.readFileSync(logPath, 'utf-8');
            const logs = content.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(Boolean)
                .reverse();

            res.json({ success: true, logs });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error reading logs' });
        }
    }
});
