document.getElementById("form").addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    console.log("Dados de login:", { email, senha }); 

    try {
        const response = await fetch('http://localhost:3000/autenticar-aluno', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const result = await response.json();

        const messageDiv = document.getElementById("message");
        messageDiv.innerText = result.message; 

        if (!response.ok) {
            console.error("Erro ao fazer login:", result.message);
            return; 
        }

        if (result.success) {
            window.location.href = "/area_aluno.html";
        }
    } catch (error) {
        console.error("Erro ao fazer login:", error);
        document.getElementById("message").innerText = "Erro ao tentar fazer login."; 
    }
});