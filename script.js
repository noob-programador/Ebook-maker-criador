document.addEventListener('DOMContentLoaded', function() {
    // Elementos da UI
    const editor = document.getElementById('editor');
    const chapterList = document.getElementById('chapter-list');
    const addChapterBtn = document.getElementById('add-chapter');
    const wordCountEl = document.getElementById('word-count');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const distractionFreeBtn = document.getElementById('distraction-free');
    const saveBtn = document.getElementById('save-btn');
    const exportBtn = document.getElementById('export-btn');
    const exportModal = document.getElementById('export-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.getElementById('sidebar');
    const progressBar = document.getElementById('writing-progress');
    const progressText = document.getElementById('progress-text');
    const aiModal = document.getElementById('ai-modal');
    const aiAssistBtn = document.getElementById('ai-assist');
    const aiOptions = document.querySelectorAll('.btn-ai');
    const aiResult = document.getElementById('ai-result');
    const applyAiBtn = document.getElementById('apply-ai');
    const spellCheckBtn = document.getElementById('spell-check');
    const insertImageBtn = document.getElementById('insert-image');
    const insertQuoteBtn = document.getElementById('insert-quote');
    const dailyGoalInput = document.getElementById('daily-goal');
    const coverModal = document.getElementById('cover-modal');
    const coverPreview = document.getElementById('cover-preview');
    const coverTitle = document.getElementById('cover-title');
    const coverAuthor = document.getElementById('cover-author');
    const coverBgColor = document.getElementById('cover-bg-color');
    const coverTextColor = document.getElementById('cover-text-color');
    const coverTemplate = document.getElementById('cover-template');
    const downloadCoverBtn = document.getElementById('download-cover');
    const coverImageUpload = document.getElementById('cover-image-upload');
    const removeImageBtn = document.getElementById('remove-image');
    const apiSettingsBtn = document.getElementById('api-settings-btn');
    const apiSettingsModal = document.getElementById('api-settings-modal');
    const mistralApiKeyInput = document.getElementById('mistral-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key');
    const testApiKeyBtn = document.getElementById('test-api-key');

    // Estado da aplicação
    let chapters = [];
    let currentChapterId = null;
    let wordCount = 0;
    let dailyGoal = 1000;
    let darkMode = localStorage.getItem('darkMode') === 'true';
    let distractionFree = false;
    let mistralAPIKey = '';
    let coverBackgroundImage = null;
    
    // Inicialização
    init();
    
    function init() {
        // Configurar modo escuro
        if (darkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        // Carregar dados salvos
        loadData();
        loadAPIKey();
        
        // Configurar meta diária
        dailyGoalInput.value = dailyGoal;
        dailyGoalInput.addEventListener('change', function() {
            dailyGoal = parseInt(this.value) || 1000;
            updateWritingProgress();
            saveData();
        });
        
        // Adicionar primeiro capítulo se não houver nenhum
        if (chapters.length === 0) {
            addChapter('Introdução');
        } else {
            loadChapter(chapters[0].id);
        }
        
        // Configurar eventos
        setupEventListeners();
        
        // Atualizar contagem de palavras
        updateWordCount();
    }
    
    function setupEventListeners() {
        // Editor de texto
        editor.addEventListener('input', function() {
            saveCurrentChapter();
            updateWordCount();
            updateWritingProgress();
        });
        
        // Botões de formatação
        document.querySelectorAll('[data-command]').forEach(button => {
            button.addEventListener('click', function() {
                const command = this.getAttribute('data-command');
                const value = this.getAttribute('data-value');
                document.execCommand(command, false, value || null);
                editor.focus();
            });
        });
        
        // Capítulos
        addChapterBtn.addEventListener('click', function() {
            const chapterName = prompt('Nome do capítulo:', `Capítulo ${chapters.length + 1}`);
            if (chapterName) {
                addChapter(chapterName);
            }
        });
        
        // Modo escuro
        darkModeToggle.addEventListener('click', toggleDarkMode);
        
        // Modo distração zero
        distractionFreeBtn.addEventListener('click', toggleDistractionFree);
        
        // Salvar
        saveBtn.addEventListener('click', saveData);
        
        // Exportar
        exportBtn.addEventListener('click', function() {
            exportModal.style.display = 'flex';
        });
        
        // Fechar modais
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                exportModal.style.display = 'none';
                aiModal.style.display = 'none';
                coverModal.style.display = 'none';
                apiSettingsModal.style.display = 'none';
            });
        });
        
        // Clicar fora do modal para fechar
        window.addEventListener('click', function(event) {
            if (event.target === exportModal) exportModal.style.display = 'none';
            if (event.target === aiModal) aiModal.style.display = 'none';
            if (event.target === coverModal) coverModal.style.display = 'none';
            if (event.target === apiSettingsModal) apiSettingsModal.style.display = 'none';
        });
        
        // Alternar sidebar (mobile)
        toggleSidebarBtn.addEventListener('click', function() {
            sidebar.classList.toggle('visible');
        });
        
        // Assistente de IA
        aiAssistBtn.addEventListener('click', function() {
            aiModal.style.display = 'flex';
        });
        
        aiOptions.forEach(option => {
            option.addEventListener('click', function() {
                const action = this.getAttribute('data-ai-action');
                getAISuggestion(action);
            });
        });
        
        applyAiBtn.addEventListener('click', applyAISuggestion);
        
        // Verificação ortográfica
        spellCheckBtn.addEventListener('click', toggleSpellCheck);
        
        // Inserir imagem
        insertImageBtn.addEventListener('click', insertImage);
        
        // Inserir citação
        insertQuoteBtn.addEventListener('click', insertFancyQuote);
        
        // Exportação PDF
        document.getElementById('export-pdf').addEventListener('click', exportToPDF);
        
        // Exportação EPUB
        document.getElementById('export-epub').addEventListener('click', exportToEPUB);
        
        // Gerador de capa
        document.getElementById('export-cover').addEventListener('click', function() {
            const title = document.getElementById('ebook-title').value || 'Meu Ebook';
            const author = document.getElementById('ebook-author').value || 'Autor Desconhecido';
            
            coverTitle.textContent = title;
            coverAuthor.textContent = author;
            coverModal.style.display = 'flex';
        });
        
        // Controles do gerador de capa
        coverBgColor.addEventListener('input', updateCoverPreview);
        coverTextColor.addEventListener('input', updateCoverPreview);
        coverTemplate.addEventListener('change', updateCoverPreview);
        
        // Upload de imagem para capa
        coverImageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.match('image.*')) {
                alert('Por favor, selecione um arquivo de imagem válido.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                coverBackgroundImage = event.target.result;
                updateCoverPreview();
                removeImageBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        });

        // Remover imagem da capa
        removeImageBtn.addEventListener('click', function() {
            coverBackgroundImage = null;
            coverImageUpload.value = '';
            removeImageBtn.style.display = 'none';
            updateCoverPreview();
        });

        // Baixar capa
        downloadCoverBtn.addEventListener('click', downloadCover);
        
        // Configurações da API
        apiSettingsBtn.addEventListener('click', function() {
            apiSettingsModal.style.display = 'flex';
            mistralApiKeyInput.value = mistralAPIKey || '';
        });

        // Salvar chave API
        saveApiKeyBtn.addEventListener('click', function() {
            mistralAPIKey = mistralApiKeyInput.value.trim();
            localStorage.setItem('mistralAPIKey', mistralAPIKey);
            alert('Chave API salva com sucesso!');
            updateAPIStatus();
        });

        // Testar conexão com API
        testApiKeyBtn.addEventListener('click', async function() {
            const testBtn = this;
            const originalText = testBtn.innerHTML;
            testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando...';
            
            try {
                const isValid = await testMistralAPI();
                if (isValid) {
                    alert('Conexão com a API estabelecida com sucesso!');
                } else {
                    alert('Falha na conexão. Verifique sua chave API.');
                }
            } catch (error) {
                alert('Erro ao testar conexão: ' + error.message);
            } finally {
                testBtn.innerHTML = originalText;
            }
        });
        
        // Atalhos de teclado
        document.addEventListener('keydown', function(e) {
            // Ctrl+S para salvar
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveData();
            }
            
            // Ctrl+B para negrito
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                document.execCommand('bold', false, null);
            }
            
            // Ctrl+I para itálico
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                document.execCommand('italic', false, null);
            }
            
            // Ctrl+U para sublinhado
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                document.execCommand('underline', false, null);
            }
        });
    }
    
    // Funções de capítulos
    function addChapter(name) {
        const id = Date.now().toString();
        const newChapter = {
            id,
            name,
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        chapters.push(newChapter);
        renderChapterList();
        loadChapter(id);
        saveData();
    }
    
    function renderChapterList() {
        chapterList.innerHTML = '';
        
        chapters.forEach(chapter => {
            const li = document.createElement('li');
            li.className = 'chapter-item' + (chapter.id === currentChapterId ? ' active' : '');
            li.innerHTML = `
                <span>${chapter.name}</span>
                <i class="fas fa-trash delete-chapter" data-id="${chapter.id}"></i>
            `;
            
            li.addEventListener('click', function() {
                if (!event.target.classList.contains('delete-chapter')) {
                    loadChapter(chapter.id);
                }
            });
            
            const deleteBtn = li.querySelector('.delete-chapter');
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteChapter(chapter.id);
            });
            
            chapterList.appendChild(li);
        });
    }
    
    function loadChapter(id) {
        const chapter = chapters.find(c => c.id === id);
        if (!chapter) return;
        
        currentChapterId = id;
        editor.innerHTML = chapter.content;
        renderChapterList();
    }
    
    function saveCurrentChapter() {
        const chapterIndex = chapters.findIndex(c => c.id === currentChapterId);
        if (chapterIndex !== -1) {
            chapters[chapterIndex].content = editor.innerHTML;
            chapters[chapterIndex].updatedAt = new Date().toISOString();
        }
    }
    
    function deleteChapter(id) {
        if (chapters.length <= 1) {
            alert('Você precisa ter pelo menos um capítulo.');
            return;
        }
        
        if (confirm('Tem certeza que deseja excluir este capítulo?')) {
            chapters = chapters.filter(c => c.id !== id);
            
            if (currentChapterId === id) {
                loadChapter(chapters[0].id);
            }
            
            renderChapterList();
            saveData();
        }
    }
    
    // Contagem de palavras e progresso
    function updateWordCount() {
        const text = editor.innerText || '';
        wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        wordCountEl.textContent = wordCount.toLocaleString();
    }
    
    function updateWritingProgress() {
        const progress = Math.min((wordCount / dailyGoal) * 100, 100);
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}% da meta diária (${wordCount}/${dailyGoal} palavras)`;
    }
    
    // Modo escuro
    function toggleDarkMode() {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode');
        
        if (darkMode) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        localStorage.setItem('darkMode', darkMode);
    }
    
    // Modo distração zero
    function toggleDistractionFree() {
        distractionFree = !distractionFree;
        document.body.classList.toggle('distraction-free');
        
        if (distractionFree) {
            distractionFreeBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            distractionFreeBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }
    
    // Verificação ortográfica
    function toggleSpellCheck() {
        editor.spellcheck = !editor.spellcheck;
        spellCheckBtn.classList.toggle('active', editor.spellcheck);
    }
    
    // Inserir imagem
    function insertImage() {
        const imageUrl = prompt('URL da imagem:', 'https://');
        if (imageUrl) {
            document.execCommand('insertImage', false, imageUrl);
        }
    }
    
    // Inserir citação formatada
    function insertFancyQuote() {
        const author = prompt('Autor da citação (opcional):', '');
        const quoteText = prompt('Texto da citação:', '');
        
        if (quoteText) {
            let html = `<blockquote class="fancy-quote">
                <p>${quoteText}</p>`;
            
            if (author) {
                html += `<footer>— ${author}</footer>`;
            }
            
            html += `</blockquote>`;
            
            document.execCommand('insertHTML', false, html);
        }
    }
    
    // Assistente de IA com Mistral
    async function getAISuggestion(action) {
        if (!mistralAPIKey) {
            alert('Por favor, configure sua chave API Mistral primeiro');
            apiSettingsModal.style.display = 'flex';
            return;
        }

        const selectedText = editor.innerText.substring(
            editor.selectionStart, 
            editor.selectionEnd
        ) || editor.innerText;

        const prompt = {
            'improve': `Melhore este texto mantendo o mesmo significado: "${selectedText}"`,
            'expand': `Expanda esta ideia: "${selectedText}"`,
            'summarize': `Resuma este texto: "${selectedText}"`,
            'correct': `Corrija gramática e estilo deste texto: "${selectedText}"`
        }[action] || selectedText;

        try {
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mistralAPIKey}`
                },
                body: JSON.stringify({
                    model: 'mistral-tiny',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }

            const data = await response.json();
            const suggestion = data.choices?.[0]?.message?.content || 'Nenhuma sugestão retornada';
            aiResult.innerHTML = `<p>${suggestion}</p>`;
        } catch (error) {
            aiResult.innerHTML = `<p class="error">Erro ao acessar a API: ${error.message}</p>`;
        }
    }
    
    function applyAISuggestion() {
        const suggestion = aiResult.innerText;
        if (suggestion && !suggestion.includes('Selecione uma opção')) {
            document.execCommand('insertText', false, suggestion);
            aiModal.style.display = 'none';
        }
    }
    
    // Exportação para PDF usando jsPDF
    function exportToPDF() {
        const title = document.getElementById('ebook-title').value || 'Meu Ebook';
        const author = document.getElementById('ebook-author').value || 'Autor Desconhecido';
        const pageSize = document.getElementById('ebook-page-size').value;
        const margin = parseInt(document.getElementById('ebook-margin').value);
        const fontChoice = document.getElementById('ebook-font').value;
        
        // Criar novo documento PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: pageSize
        });
        
        // Configurar metadados
        doc.setProperties({
            title: title,
            author: author,
            creator: 'EbookMaker'
        });
        
        // Adicionar título
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text(title, margin, margin + 20);
        
        // Adicionar autor
        doc.setFontSize(16);
        doc.setTextColor(100, 100, 100);
        doc.text(`Por ${author}`, margin, margin + 30);
        
        // Adicionar conteúdo
        let yPosition = margin + 50;
        const pageWidth = doc.internal.pageSize.width - (margin * 2);
        
        // Processar cada capítulo
        chapters.forEach((chapter, index) => {
            // Adicionar título do capítulo
            if (index > 0) doc.addPage();
            
            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text(chapter.name, margin, yPosition);
            yPosition += 15;
            
            // Converter HTML para texto formatado
            const div = document.createElement('div');
            div.innerHTML = chapter.content;
            const text = div.textContent || div.innerText || '';
            
            // Configurar fonte
            const fontFamily = fontChoice === 'serif' ? 'Times' : 
                            fontChoice === 'monospace' ? 'Courier' : 'Helvetica';
            doc.setFont(fontFamily);
            doc.setFontSize(12);
            
            // Adicionar texto
            const lines = doc.splitTextToSize(text, pageWidth);
            for (let i = 0; i < lines.length; i++) {
                if (yPosition > doc.internal.pageSize.height - margin) {
                    doc.addPage();
                    yPosition = margin;
                }
                doc.text(lines[i], margin, yPosition);
                yPosition += 7;
            }
            
            yPosition += 10;
        });
        
        // Salvar PDF
        doc.save(`${title}.pdf`);
        exportModal.style.display = 'none';
    }
    
    // Exportação para EPUB (simplificada)
    function exportToEPUB() {
        const title = document.getElementById('ebook-title').value || 'Meu Ebook';
        const author = document.getElementById('ebook-author').value || 'Autor Desconhecido';
        
        // Estrutura básica do EPUB
        const epubContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="uid">urn:uuid:${generateUUID()}</dc:identifier>
        <dc:title>${title}</dc:title>
        <dc:creator>${author}</dc:creator>
        <dc:language>pt-BR</dc:language>
    </metadata>
    <manifest>
        <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>
        ${chapters.map((chap, i) => 
            `<item id="chapter${i}" href="chapter${i}.xhtml" media-type="application/xhtml+xml"/>`
        ).join('\n        ')}
    </manifest>
    <spine toc="toc">
        ${chapters.map((chap, i) => 
            `<itemref idref="chapter${i}"/>`
        ).join('\n        ')}
    </spine>
</package>`;
        
        // Criar arquivo ZIP (simulação)
        alert(`EPUB gerado com sucesso!\n\nEsta é uma simulação. Em uma implementação real, seria gerado um arquivo .epub válido com todos os arquivos necessários.`);
        console.log('Conteúdo OPF:', epubContent);
        exportModal.style.display = 'none';
    }
    
    // Gerador de UUID simples para EPUB
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Gerador de capa com upload de imagem
    function updateCoverPreview() {
        const container = document.getElementById('cover-image-container');
        container.style.backgroundImage = coverBackgroundImage ? `url(${coverBackgroundImage})` : 'none';
        
        if (coverBackgroundImage) {
            container.style.display = 'block';
            document.getElementById('cover-preview').style.backgroundColor = 'transparent';
        } else {
            container.style.display = 'none';
            document.getElementById('cover-preview').style.backgroundColor = coverBgColor.value;
        }
        
        // Estilo do texto baseado no template
        switch(coverTemplate.value) {
            case 'modern':
                coverTitle.style.fontSize = '2.8rem';
                coverTitle.style.fontWeight = '800';
                coverAuthor.style.fontSize = '1.3rem';
                coverAuthor.style.letterSpacing = '2px';
                break;
            case 'elegant':
                coverTitle.style.fontFamily = 'Georgia, serif';
                coverTitle.style.fontSize = '2.2rem';
                coverTitle.style.fontWeight = 'normal';
                coverTitle.style.fontStyle = 'italic';
                coverAuthor.style.fontFamily = 'Georgia, serif';
                coverAuthor.style.fontSize = '1.2rem';
                break;
            default: // simple
                coverTitle.style.fontSize = '2.5rem';
                coverTitle.style.fontWeight = 'bold';
                coverAuthor.style.fontSize = '1.5rem';
        }
        
        // Cor do texto
        coverTitle.style.color = coverTextColor.value;
        coverAuthor.style.color = coverTextColor.value;
    }
    
    function downloadCover() {
        const { jsPDF } = window.jspdf;
        const canvas = document.createElement('canvas');
        const preview = document.getElementById('cover-preview');
        canvas.width = preview.offsetWidth;
        canvas.height = preview.offsetHeight;
        const ctx = canvas.getContext('2d');
        
        // Desenhar fundo
        if (coverBackgroundImage) {
            const img = new Image();
            img.src = coverBackgroundImage;
            // Esperar o carregamento da imagem
            img.onload = function() {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                drawTextElements();
            };
        } else {
            ctx.fillStyle = coverBgColor.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawTextElements();
        }
        
        function drawTextElements() {
            ctx.fillStyle = coverTextColor.value;
            ctx.textAlign = 'center';
            
            // Estilo baseado no template
            switch(coverTemplate.value) {
                case 'modern':
                    ctx.font = 'bold 60px Arial';
                    break;
                case 'elegant':
                    ctx.font = 'italic 50px Georgia';
                    break;
                default:
                    ctx.font = 'bold 55px Arial';
            }
            
            ctx.fillText(coverTitle.textContent, canvas.width/2, canvas.height/2);
            
            // Adicionar autor
            switch(coverTemplate.value) {
                case 'modern':
                    ctx.font = '25px Arial';
                    break;
                case 'elegant':
                    ctx.font = '20px Georgia';
                    break;
                default:
                    ctx.font = '30px Arial';
            }
            
            ctx.fillText(coverAuthor.textContent, canvas.width/2, canvas.height/2 + 70);
            
            // Criar PDF
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a5"
            });
            
            doc.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, 148, 210);
            doc.save(`Capa - ${coverTitle.textContent}.pdf`);
        }
    }
    
    // Funções da API Mistral
    async function testMistralAPI() {
        if (!mistralAPIKey) {
            throw new Error('Nenhuma chave API configurada');
        }

        const response = await fetch('https://api.mistral.ai/v1/models', {
            headers: {
                'Authorization': `Bearer ${mistralAPIKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data.data);
    }

    function updateAPIStatus() {
        const apiStatus = document.createElement('span');
        apiStatus.className = `api-status ${mistralAPIKey ? 'connected' : 'disconnected'}`;
        apiStatus.innerHTML = `
            <span class="api-status-indicator"></span>
            ${mistralAPIKey ? 'Conectado' : 'Desconectado'}
        `;
        
        const existingStatus = document.querySelector('.api-status');
        if (existingStatus) {
            existingStatus.replaceWith(apiStatus);
        } else {
            document.getElementById('api-settings-btn').after(apiStatus);
        }
    }

    function loadAPIKey() {
        const savedKey = localStorage.getItem('mistralAPIKey');
        if (savedKey) {
            mistralAPIKey = savedKey;
            updateAPIStatus();
        }
    }
    
    // Armazenamento local
    function saveData() {
        saveCurrentChapter();
        localStorage.setItem('ebookMakerData', JSON.stringify({
            chapters,
            currentChapterId,
            dailyGoal,
            darkMode,
            settings: {
                font: document.getElementById('ebook-font').value
            }
        }));
        
        // Feedback visual
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvo';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
        }, 2000);
    }
    
    function loadData() {
        const savedData = localStorage.getItem('ebookMakerData');
        if (savedData) {
            const data = JSON.parse(savedData);
            chapters = data.chapters || [];
            currentChapterId = data.currentChapterId || null;
            dailyGoal = data.dailyGoal || 1000;
            darkMode = data.darkMode || false;
            
            if (data.settings && data.settings.font) {
                document.getElementById('ebook-font').value = data.settings.font;
            }
        }
    }
    
    // Carregar conteúdo inicial no editor
    editor.innerHTML = '<p>Comece a escrever seu ebook aqui...</p>';
});