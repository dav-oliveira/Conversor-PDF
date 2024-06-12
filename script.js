document.getElementById('fileInput').addEventListener('change', handleFile, false);

// Função para lidar com o arquivo selecionado
function handleFile(e) {
    const files = e.target.files, f = files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        window.excelData = rows;
    };
    reader.readAsArrayBuffer(f);
}

// Função para gerar os recibos em PDF
async function gerarRecibos() {
    if (!window.excelData) {
        alert("Por favor, carregue um arquivo .xlsx primeiro.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const zip = new JSZip();
    const rows = window.excelData.slice(1); // Ignora o cabeçalho

    if (rows.length > 0) {
        console.log(`Total de recibos a serem gerados: ${rows.length}`);
    }

    for (const [index, row] of rows.entries()) {
        const [data, cpf, nome, qtdCorridas, faturamento, taxa, valorPago, nf] = row;

        if (!cpf || !nome || !qtdCorridas || !faturamento || !taxa || !valorPago || !nf) {
            console.warn(`Linha ${index + 2} está faltando dados. Pulando...`);
            continue;
        }

        // Convertendo a data do Excel para o formato de data JavaScript
        const excelDate = new Date((data - (25567 + 1)) * 86400 * 1000);
        const diaPlanilha = String(excelDate.getDate()).padStart(2, '0');
        const mesPlanilha = String(excelDate.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
        const anoPlanilha = excelDate.getFullYear();
        const dataPlanilha = `${diaPlanilha}/${mesPlanilha}/${anoPlanilha}`;

        // Formatando os valores
        const qtdCorridasFormatado = parseInt(qtdCorridas, 10);
        const faturamentoFormatado = parseFloat(faturamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const taxaFormatada = parseFloat(taxa).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 2 });
        const valorPagoFormatado = parseFloat(valorPago).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const doc = new jsPDF();

        // Cabeçalho com logo e título
        const imgData = 'data:image/png;base64,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';
        doc.addImage(imgData, 'PNG', 20, 10, 30, 30); // Ajuste as coordenadas e o tamanho conforme necessário
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text('Recibo Digital', 105, 25, null, null, 'center');

        // Espaço maior entre o cabeçalho e o conteúdo
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Bragança Paulista, ${dataPlanilha}`, 20, 50);
        doc.text(`Nome: ${nome}`, 20, 60);
        doc.text(`CPF: ${cpf}`, 20, 70);

        // Linha separadora
        doc.setLineWidth(0.5);
        doc.line(20, 80, 190, 80);

        // Informações do mês
        doc.setFont("helvetica", "bold");
        doc.text(`${nf}`, 20, 95);
        doc.setFont("helvetica", "normal");

        // Contêiner com fundo cinza mais escuro para destacar o texto de taxa e valor
        doc.setFillColor(100, 100, 100); // Cor cinza mais escuro
        doc.rect(130, 30, 65, 20, 'F'); // Define um retângulo de fundo cinza mais escuro

        // Adiciona o texto de taxa e valor dentro do contêiner cinza
        doc.setTextColor(255, 255, 255); // Cor do texto (branco)
        doc.setFont("helvetica", "bold"); // Texto em negrito
        doc.text('Valor de taxa Paga no mês:', 162, 35, null, null, 'center');

        doc.setFont("hevelica", "bold");
        doc.setFontSize(18);
        doc.text(valorPagoFormatado, 162, 45, null, null, 'center');

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0); // Cor do texto (preto)
        doc.text(`- Qtd. de Corridas: ${qtdCorridasFormatado}`, 20, 105);
        doc.text(`- Faturamento Bruto: ${faturamentoFormatado}`, 20, 115);
        doc.text(`- Taxa do Mês: ${taxaFormatada}`, 20, 125);

        doc.text('Obrigado por utilizar nossos serviços e bons ganhos !!!', 20, 145);

        // Linha separadora
        doc.setLineWidth(0.5);
        doc.line(20, 160, 190, 160);

        // Rodapé
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text('VRDrive - Transporte por Aplicativo', 20, 175);
        doc.text('É só chamar que vem!!!', 20, 185);
        doc.text('www.vrdrive.com.br', 20, 190);
        doc.text('www.facebook.com/app.vrdrive', 20, 195);
        doc.text('www.instagram.com/vrdrive.app', 20, 200);

        // Adiciona texto no rodapé com data e hora de emissão
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text('Obrigado por usar a VRDrive!', 105, 290, null, null, 'center');

        const pdfData = doc.output('arraybuffer');
        zip.file(`${cpf}.pdf`, pdfData);
        console.log(`Recibo gerado para: ${nome}, CPF: ${cpf}`);
    }

    // Gera o arquivo ZIP com todos os recibos
    zip.generateAsync({ type: 'blob' }).then(function (content) {
        const element = document.createElement('a');
        element.href = URL.createObjectURL(content);
        element.download = 'recibos.zip';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        console.log("Arquivo ZIP criado e baixado.");
    });
}