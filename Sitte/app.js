import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const CARGOS = {
    25: { nome: "Fundador Supremo", cor: "#ff0000", desc: "Criador e autoridade máxima." },
    24: { nome: "Dono", cor: "#ff4500", desc: "Proprietário do servidor." },
    19: { nome: "Administrador", cor: "#8a2be2", desc: "Gerencia a ordem geral." },
    11: { nome: "Ajudante", cor: "#3498db", desc: "Suporte aos novos membros." },
    1:  { nome: "Recruta", cor: "#5865f2", desc: "Membro recém-chegado." }
};

let userDados = null;

// --- NAVEGAÇÃO ---
window.mudarAba = (id) => {
    const secoes = ['aba-chat', 'aba-membros', 'aba-perfil', 'aba-classes'];
    secoes.forEach(s => document.getElementById(s).style.display = (s === 'aba-'+id) ? 'block' : 'none');
};

// --- AUTH: CRIAR CONTA E LOGIN ---
document.getElementById('btn-cadastro').onclick = async () => {
    const nome = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    
    if(!nome || !email || pass.length < 6) return alert("Preencha tudo! Senha min. 6 caracteres.");

    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "usuarios", res.user.uid), {
            nome: nome,
            email: email,
            nivel: 1,
            banido: false,
            criadoEm: new Date().toLocaleDateString()
        });
        alert("Conta criada com sucesso!");
    } catch (e) { alert("Erro: " + e.message); }
};

document.getElementById('btn-login').onclick = () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    signInWithEmailAndPassword(auth, email, pass).catch(e => alert("Erro: " + e.message));
};

document.getElementById('btn-sair').onclick = () => signOut(auth).then(() => location.reload());

// --- CARREGAR INTERFACE ---
function atualizarInterface() {
    // Aba Perfil
    const cargo = CARGOS[userDados.nivel] || CARGOS[1];
    document.getElementById('perfil-detalhes').innerHTML = `
        <p><b>Nome:</b> ${userDados.nome}</p>
        <p><b>E-mail:</b> ${userDados.email}</p>
        <p><b>Classe:</b> <span style="color:${cargo.cor}">${cargo.nome} (Nível ${userDados.nivel})</span></p>
        <p><b>Membro desde:</b> ${userDados.criadoEm || 'Não informado'}</p>
    `;

    // Aba Classes
    const listaClasses = document.getElementById('lista-classes');
    listaClasses.innerHTML = "";
    Object.keys(CARGOS).reverse().forEach(lvl => {
        const c = CARGOS[lvl];
        listaClasses.innerHTML += `
            <div class="class-card" style="border-left: 5px solid ${c.cor}">
                <h4 style="color:${c.cor}">${c.nome} (LVL ${lvl})</h4>
                <p>${c.desc}</p>
            </div>
        `;
    });
}

// --- MONITORAMENTO ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
            userDados = snap.data();
            if(userDados.banido) { alert("BANIDO"); signOut(auth); return; }
            
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-site').style.display = 'flex';
            atualizarInterface();
        });

        // Chat
        onSnapshot(query(collection(db, "mensagens"), orderBy("data", "asc")), (snap) => {
            const box = document.getElementById('chat-messages');
            box.innerHTML = "";
            snap.forEach(d => {
                const m = d.data();
                const c = CARGOS[m.nivel] || CARGOS[1];
                box.innerHTML += `<p><b style="color:${c.cor}">[${c.nome}] ${m.nomeUsuario}:</b> ${m.texto}</p>`;
            });
            box.scrollTop = box.scrollHeight;
        });
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-site').style.display = 'none';
    }
});

// Enviar Msg
document.getElementById('btn-enviar').onclick = async () => {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    await addDoc(collection(db, "mensagens"), {
        texto: input.value, nomeUsuario: userDados.nome, nivel: userDados.nivel, data: serverTimestamp()
    });
    input.value = "";
};