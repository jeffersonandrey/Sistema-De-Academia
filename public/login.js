document.getElementById("form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    console.log("Dados de login:", { email, senha }); 

    try {
        // Requisição para autenticar o usuário
        const response = await fetch('http://localhost:3000/autenticar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const result = await response.json();

        // Exibe a mensagem de resposta
        const messageDiv = document.getElementById("message");
        messageDiv.innerText = result.message; 

        if (!response.ok) {
            console.error("Erro ao fazer login:", result.message);
            return; 
        }

        if (result.success) {
            // Redireciona com base no tipo de usuário
            if (result.tipo === 'admin') {
                window.location.href = "/gerenciador.html"; // Página específica para administradores
            } else if (result.tipo === 'aluno') {
                window.location.href = "/area_aluno.html"; // Página específica para alunos
            }
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        document.getElementById("message").innerText = "Erro ao tentar fazer login."; 
    }
});
