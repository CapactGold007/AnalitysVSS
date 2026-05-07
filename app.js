import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- HIERARQUIA EXATA DO PAPEL (Menor pro Maior, com Estrutura de Árvore) ---
const CARGOS_INFO = {
    1: { nome: "I - INICIANTE", cor: "#5865f2" }, 2: { nome: "II - SOLDADO", cor: "#ffffff" },
    3: { nome: "III - CABO", cor: "#95a5a6" }, 4: { nome: "IV - 3º SARGENTO", cor: "#bdc3c7" },
    5: { nome: "V - 2º SARGENTO", cor: "#1abc9c" }, 6: { nome: "VI - 1º SARGENTO", cor: "#2980b9" },
    7: { nome: "VII - CAPITÃO", cor: "#3498db" }, 8: { nome: "IX - MAJOR", cor: "#27ae60" },
    9: { nome: "X - MARECHAL", cor: "#2ecc71" }, 15: { nome: "SÓCIO", cor: "#9400d3" },
    16: { nome: "ESPECIAL STAFF", cor: "#a29bfe" }, 20: { nome: "3º AUTORIDADE", cor: "#daa520" },
    21: { nome: "2º AUTORIDADE MÁXIMA", cor: "#ffd700" }, 22: { nome: "CESAR", cor: "#ff8c00" },
    23: { nome: "ANALITY", cor: "#ff4500" }, 25: { nome: "FUNDADOR", cor: "#ff0000" }
};

// Esta estrutura define quem é filho de quem na árvore visual
const ESTRUTURA_ARVORE = [
    { nivel: 25, filhos: [
        { nivel: 23 },
        { nivel: 22, filhos: [
            { nivel: 21 },
            { nivel: 20, filhos: [
                { nivel: 16 },
                { nivel: 15 }
            ]}
        ]},
        { nivel: 9, filhos: [
            { nivel: 8, filhos: [
                { nivel: 7, filhos: [
                    { nivel: 6, filhos: [
                        { nivel: 5, filhos: [
                            { nivel: 4, filhos: [
                                { nivel: 3, filhos: [
                                    { nivel: 2, filhos: [
                                        { nivel: 1 }
                                    ]}
                                ]}
                            ]}
                        ]}
                    ]}
                ]}
            ]}
        ]}
    ]}
];

let userDados = null;

// --- NAVEGAÇÃO ---
window.mudarAba = (id) => {
    const abas = ['aba-chat', 'aba-arvore', 'aba-perfil'];
    abas.forEach(aba => {
        const el = document.getElementById(aba);
        if (el) el.style.display = (aba === 'aba-' + id) ? 'block' : 'none';
    });
};

// --- FUNÇÃO PARA DESENHAR A ÁRVORE VISUAL (ul/li aninhados) ---
function gerarHtmlArvore(nodos) {
    let html = "<ul>";
    nodos.forEach(nodo => {
        const info = CARGOS_INFO[nodo.nivel];
        html += `<li><b style="color:${info.cor}; border-color:${info.cor}">[${info.nome}]</b>`;
        if (nodo.filhos && nodo.filhos.length > 0) {
            html += gerarHtmlArvore(nodo.filhos);
        }
        html += "</li>";
    });
    html += "</ul>";
    return html;
}

function desenharArvoreVisual() {
    const container = document.getElementById('tree-display');
    if (!container) return;
    // Gera o HTML recursivamente e coloca no contêiner
    container.innerHTML = gerarHtmlArvore(ESTRUTURA_ARVORE);
}

// --- MONITORAMENTO ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
            userDados = snap.data();
            if(!userDados) return;
            
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-site').style.display = 'flex';
            
            // ABA PERFIL E MINI-PERFIL
            const cargo = CARGOS_INFO[userDados.nivel] || CARGOS_INFO[1];
            document.getElementById('perfil-detalhes').innerHTML = `<div class="card"><h2>${userDados.nome}</h2><p>Cargo: <span style="color:${cargo.cor}">${cargo.nome}</span></p></div>`;
            document.getElementById('status-bar').innerHTML = `Logado: <b style="color:${cargo.cor}">${userDados.nome}</b>`;
            
            // Desenha a árvore visual
            desenharArvoreVisual();
        });

        // CHAT
        onSnapshot(query(collection(db, "mensagens"), orderBy("data", "asc")), (snap) => {
            const box = document.getElementById('chat-messages');
            box.innerHTML = "";
            snap.forEach(d => {
                const m = d.data();
                const c = CARGOS_INFO[m.nivel] || CARGOS_INFO[1];
                box.innerHTML += `<p><b style="color:${c.cor}">[${c.nome}] ${m.nomeUsuario}:</b> ${m.texto}</p>`;
            });
            box.scrollTop = box.scrollHeight;
        });

    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-site').style.display = 'none';
    }
});

// Ações
document.getElementById('btn-enviar').onclick = async () => {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    await addDoc(collection(db, "mensagens"), { texto: input.value, nomeUsuario: userDados.nome, nivel: userDados.nivel, data: serverTimestamp() });
    input.value = "";
};

document.getElementById('btn-login').onclick = () => signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('pass').value);
document.getElementById('btn-cadastro').onclick = async () => {
    const n = document.getElementById('username').value, e = document.getElementById('email').value, p = document.getElementById('pass').value;
    const res = await createUserWithEmailAndPassword(auth, e, p);
    await setDoc(doc(db, "usuarios", res.user.uid), { nome: n, email: e, nivel: 1, banido: false });
};
document.getElementById('btn-sair').onclick = () => signOut(auth).then(()=>location.reload());