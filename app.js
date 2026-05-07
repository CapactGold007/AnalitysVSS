import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, query, orderBy, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDK-yme2jxzdjvunQqkuB26r3oKH4OOS0I",
    authDomain: "analitysvss.firebaseapp.com",
    projectId: "analitysvss",
    storageBucket: "analitysvss.firebasestorage.app",
    messagingSenderId: "665486639760",
    appId: "1:665486639760:web:16dd3ee053cd283f5e4e15"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HIERARQUIA COM RAMIFICAÇÃO (A e B) ---
const CARGOS_INFO = {
    // Tronco Comum (Militar)
    "1": { nome: "I - INICIANTE", cor: "#5865f2" },
    "2": { nome: "II - SOLDADO", cor: "#ffffff" },
    "3": { nome: "III - CABO", cor: "#95a5a6" },
    "4": { nome: "IV - 3º SARGENTO", cor: "#bdc3c7" },
    "5": { nome: "V - 2º SARGENTO", cor: "#1abc9c" },
    "6": { nome: "VI - 1º SARGENTO", cor: "#2980b9" },
    "7": { nome: "VII - CAPITÃO", cor: "#3498db" },
    "8": { nome: "IX - MAJOR", cor: "#27ae60" },
    "9": { nome: "X - MARECHAL", cor: "#2ecc71" },

    // CAMINHO A (Administração / Autoridade)
    "10a": { nome: "3º AUTORIDADE", cor: "#daa520" },
    "11a": { nome: "2º AUTORIDADE MÁXIMA", cor: "#ffd700" },
    "12a": { nome: "CESAR", cor: "#ff8c00" },
    "13a": { nome: "ANALITY", cor: "#ff4500" },

    // CAMINHO B (Especial / Sócio)
    "10b": { nome: "SÓCIO / BRAÇO ESQUERDO", cor: "#9400d3" },
    "11b": { nome: "ESPECIAL STAFF", cor: "#a29bfe" },

    // TOPO ÚNICO
    "15": { nome: "FUNDADOR", cor: "#ff0000" }
};

// Estrutura Visual da Árvore Geográfica
const ESTRUTURA_ARVORE = [
    { id: "15", filhos: [
        { id: "13a", filhos: [
            { id: "12a", filhos: [
                { id: "11a", filhos: [
                    { id: "10a", filhos: [{ id: "9" }] }
                ]}
            ]}
        ]},
        { id: "11b", filhos: [
            { id: "10b", filhos: [{ id: "9" }] }
        ]}
    ]}
];

// O resto da árvore (do 9 para baixo)
const TRONCO_MILITAR = { id: "9", filhos: [{ id: "8", filhos: [{ id: "7", filhos: [{ id: "6", filhos: [{ id: "5", filhos: [{ id: "4", filhos: [{ id: "3", filhos: [{ id: "2", filhos: [{ id: "1" }] }] }] }] }] }] }] }] };

let userDados = null;

function gerarHtmlArvore(nodos) {
    let html = "<ul>";
    nodos.forEach(nodo => {
        const info = CARGOS_INFO[nodo.id];
        // Se for o Marechal, ele conecta nos dois caminhos acima
        html += `<li><b style="color:${info.cor}; border-color:${info.cor}">${info.nome}</b>`;
        if (nodo.filhos) html += gerarHtmlArvore(nodo.filhos);
        if (nodo.id === "9") html += gerarHtmlArvore([TRONCO_MILITAR.filhos[0]]);
        html += "</li>";
    });
    return html + "</ul>";
}

// --- LOGICA DE BLOQUEIO DE EVOLUÇÃO ---
// No Firebase, o nível agora será salvo como "10a" ou "10b".
// Se o nível contém 'a', o sistema impede setar qualquer coisa com 'b'.

onAuthStateChanged(auth, async (user) => {
    if (user) {
        onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
            userDados = snap.data();
            if(!userDados) return;
            
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-site').style.display = 'flex';
            
            const cargo = CARGOS_INFO[userDados.nivel] || CARGOS_INFO["1"];
            document.getElementById('status-bar').innerHTML = `Lado Escolhido: <b>${userDados.nivel.includes('a') ? 'Autoridade (A)' : userDados.nivel.includes('b') ? 'Sócio (B)' : 'Militar'}</b>`;
            document.getElementById('perfil-detalhes').innerHTML = `<h2>${userDados.nome}</h2><p style="color:${cargo.cor}">${cargo.nome}</p>`;
            
            document.getElementById('tree-display').innerHTML = gerarHtmlArvore(ESTRUTURA_ARVORE);
        });

        // Chat com suporte a letras no nível
        onSnapshot(query(collection(db, "mensagens"), orderBy("data", "asc")), (snap) => {
            const box = document.getElementById('chat-messages');
            box.innerHTML = "";
            snap.forEach(d => {
                const m = d.data();
                const c = CARGOS_INFO[m.nivel] || CARGOS_INFO["1"];
                box.innerHTML += `<p><b style="color:${c.cor}">[${c.nome}] ${m.nomeUsuario}:</b> ${m.texto}</p>`;
            });
            box.scrollTop = box.scrollHeight;
        });
    }
});

// Enviar mensagem salva o nível com a letra (ex: "12a")
document.getElementById('btn-enviar').onclick = async () => {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    await addDoc(collection(db, "mensagens"), {
        texto: input.value,
        nomeUsuario: userDados.nome,
        nivel: String(userDados.nivel), // Salva como texto para aceitar 10a, 10b
        data: serverTimestamp()
    });
    input.value = "";
};

document.getElementById('btn-cadastro').onclick = async () => {
    const n = document.getElementById('username').value, e = document.getElementById('email').value, p = document.getElementById('pass').value;
    const res = await createUserWithEmailAndPassword(auth, e, p);
    await setDoc(doc(db, "usuarios", res.user.uid), { nome: n, email: e, nivel: "1", banido: false });
};