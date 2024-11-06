// Função para formatar o CPF
function formatarCPF(value) {
    value = value.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (value.length > 9) {
        return `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9, 11)}`;
    } else if (value.length > 5) {
        return `${value.substring(0, 3)}.${value.substring(3)}`;
    } else if (value.length > 0) {
        return `${value}`;
    }
    return ''; // Retorna vazio se não houver valor
}

// Evento para formatação do CPF ao sair do campo
document.getElementById('cpfDelete').addEventListener('blur', function() {
    const cpfInput = this.value;
    this.value = formatarCPF(cpfInput);
});

// Evento para permitir apenas números
document.getElementById('cpfDelete').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, ''); // Permite apenas números
});

document.getElementById('deleteForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const cpfInput = document.getElementById('cpfDelete').value;

    const confirmDelete = confirm(`Tem certeza que deseja deletar o aluno com CPF: ${cpfInput}? Esta ação é irreversível.`);

    if (!confirmDelete) {
        return; 
    }

    console.log('Tentando deletar aluno com CPF:', cpfInput); 
    
    try {
        const response = await fetch(`/deletar-aluno/${cpfInput}`, { method: 'DELETE' });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error('Erro ao deletar aluno:', error);
        alert('Erro ao deletar aluno.');
    }
});        

document.getElementById('deleteAll').addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja deletar todos os alunos?')) return;

    if (!confirm('Esta ação é irreversível. Tem certeza que deseja deletar todos os alunos?')) return;

    if (!confirm('Na moral mesmo, isso aqui vai deletar todas as informações da tabela "alunos", esta é a sua última chance!')) return;

    try {
        const response = await fetch('/deletar-todos-alunos', { method: 'DELETE' });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error('Erro ao deletar todos os alunos:', error);
        alert('Erro ao deletar todos os alunos.');
    }
});