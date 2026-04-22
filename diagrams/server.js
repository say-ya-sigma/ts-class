const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3456;

// diagramsディレクトリのパス（server.jsと同じディレクトリ）
const DIAGRAMS_DIR = __dirname;

// 静的ファイル配信（diagramsディレクトリ）
app.use('/diagrams', express.static(DIAGRAMS_DIR));

// API: mermaidファイルを取得
app.get('/api/diagram', (req, res) => {
    const fileName = req.query.file;
    
    if (!fileName) {
        return res.status(400).json({ error: 'fileパラメータが必要です' });
    }
    
    // パスインジェクション対策: ファイル名のみ使用
    const safeFileName = path.basename(fileName);
    const filePath = path.join(DIAGRAMS_DIR, safeFileName);
    
    // ファイルが存在するか確認
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'ファイルが見つかりません' });
    }
    
    // ファイルを読み込んで返す
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.type('text/plain').send(content);
    } catch (err) {
        res.status(500).json({ error: 'ファイル読み込みエラー' });
    }
});

// ビューワーページ
app.get('/viewer', (req, res) => {
    const fileName = req.query.file || 'sample-flowchart.mmd';
    const safeFileName = path.basename(fileName);
    
    res.send(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid Viewer - ${safeFileName}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }
        #diagram { max-width: 100%; }
        .error {
            color: #e94560;
            padding: 2rem;
            background: #ffebee;
            border-radius: 8px;
            text-align: center;
        }
        .loading {
            color: #666;
            text-align: center;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div id="diagram"></div>

    <script>
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });

        async function loadDiagram(fileName) {
            const diagram = document.getElementById('diagram');
            diagram.innerHTML = '<div class="loading">読み込み中...</div>';
            
            try {
                const response = await fetch('/api/diagram?file=' + encodeURIComponent(fileName));
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || '読み込みエラー');
                }
                
                const code = await response.text();
                diagram.innerHTML = code;
                mermaid.run({ nodes: [diagram] });
            } catch (err) {
                diagram.innerHTML = '<div class="error">Error: ' + err.message + '</div>';
            }
        }

        // 初期読み込み
        loadDiagram('${safeFileName}');
    </script>
</body>
</html>
    `);
});

// API: 利用可能なファイル一覧
app.get('/api/files', (req, res) => {
    try {
        const files = fs.readdirSync(DIAGRAMS_DIR)
            .filter(f => f.endsWith('.mmd') || f.endsWith('.txt'))
            .sort();
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: 'ファイル一覧取得エラー' });
    }
});

// ルートリダイレクト
app.get('/', (req, res) => {
    res.redirect('/viewer');
});

app.listen(PORT, () => {
    console.log(`🚀 Mermaid Viewer Server running at http://localhost:${PORT}`);
    console.log(`📊 Viewer: http://localhost:${PORT}/viewer`);
    console.log(`📁 API: http://localhost:${PORT}/api/diagram?file=sample-flowchart.mmd`);
    console.log(`📝 Sample: http://localhost:${PORT}/viewer?file=sample-flowchart.mmd`);
});
