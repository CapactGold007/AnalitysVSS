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

const CARGOS_INFO = {
    "1": { nome: "I - INICIANTE", cor: "#5865f2" },
    "2": { nome: "II - SOLDADO", cor: "#ffffff" },
    "3": { nome: "III - CABO", cor: "#95a5a6" },
    "4": { nome: "IV - 3º SARGENTO", cor: "#bdc3c7" },
    "5": { nome: "V - 2º SARGENTO", cor: "#1abc9c" },
    "6": { nome: "VI - 1º SARGENTO", cor: "#2980b9" },
    "7": { nome: "VII - CAPITÃO", cor: "#3498db" },
    "8": { nome: "IX - MAJOR", cor: "#27ae60" },
    "9": { nome: "X - MARECHAL", cor: "#2ecc71" },
    "10a": { nome: "3º AUTORIDADE", cor: "#daa520" },
    "11a": { nome: "2º AUTORIDADE MÁXIMA", cor: "#ffd700" },
    "12a": { nome: "CESAR", cor: "#ff8c00" },
    "13a": { nome: "ANALITY", cor: "#ff4500" },
    "10b": { nome: "SÓCIO / BRAÇO ESQUERDO", cor: "#9400d3" },
    "11b": { nome: "ESPECIAL STAFF", cor: "#a29bfe" },
    "15": { nome: "FUNDADOR", cor: "#ff0000" }
};

let userDados = null;

// --- FUNÇÃO DE MUDAR ABA (VERSÃO PC SEM ERRO) ---
const mudarAba = (id) => {
    const abas = ['aba-chat', 'aba-arvore', 'aba-perfil'];
    abas.forEach(aba => {
        const el = document.getElementById(aba);
        if (el) el.style.display = (aba === 'aba-' + id) ? 'block' : 'none';
    });
};

// --- ÁRVORE VISUAL ---
function gerarHtmlArvore(nodos) {
    let html = "<ul>";
    nodos.forEach(nodo => {
        const info = CARGOS_INFO[nodo.id];
        html += `<li><b style="color:${info.cor}; border-color:${info.cor}">${info.nome}</b>`;
        if (nodo.filhos) html += gerarHtmlArvore(nodo.filhos);
        html += "</li>";
    });
    return html + "</ul>";
}

// Hierarquia conforme seu papel
const ESTRUTURA_ARVORE = [{ id: "15", filhos: [
    { id: "13a", filhos: [{ id: "12a", filhos: [{ id: "11a", filhos: [{ id: "10a", filhos: [{ id: "9" }] }] }] }] },
    { id: "11b", filhos: [{ id: "10b", filhos: [{ id: "9" }] }] }
]}];

// --- MONITORAMENTO ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
            userDados = snap.data();
            if(!userDados) return;
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-site').style.display = 'flex';
            const cargo = CARGOS_INFO[userDados.nivel] || CARGOS_INFO["1"];
            document.getElementById('status-bar').innerHTML = `Logado como: <b style="color:${cargo.cor}">${userDados.nome}</b>`;
            document.getElementById('tree-display').innerHTML = gerarHtmlArvore(ESTRUTURA_ARVORE);
        });

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
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-site').style.display = 'none';
    }
});

// --- CONFIGURAÇÃO DOS BOTÕES (CORREÇÃO PARA PC) ---
document.addEventListener('DOMContentLoaded', () => {
    // Abas
    document.getElementById('btn-nav-chat')?.addEventListener('click', () => mudarAba('chat'));
    document.getElementById('btn-nav-arvore')?.addEventListener('click', () => mudarAba('arvore'));
    document.getElementById('btn-nav-perfil')?.addEventListener('click', () => mudarAba('perfil'));

    // Chat
    document.getElementById('btn-enviar')?.addEventListener('click', async () => {
        const input = document.getElementById('msg-input');
        if(!input.value.trim()) return;
        await addDoc(collection(db, "mensagens"), {
            texto: input.value, nomeUsuario: userDados.nome, nivel: String(userDados.nivel), data: serverTimestamp()
        });
        input.value = "";
    });

    // Login/Sair
    document.getElementById('btn-login')?.addEventListener('click', () => {
        signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('pass').value);
    });
    document.getElementById('btn-sair')?.addEventListener('click', () => signOut(auth).then(()=>location.reload()));
    
    document.getElementById('btn-cadastro')?.addEventListener('click', async () => {
        const n = document.getElementById('username').value, e = document.getElementById('email').value, p = document.getElementById('pass').value;
        const res = await createUserWithEmailAndPassword(auth, e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nome: n, email: e, nivel: "1", banido: false });
    });
});