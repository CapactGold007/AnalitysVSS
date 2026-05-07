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

// --- HIERARQUIA DO MENOR PARA O MAIOR (Conforme sua foto) ---
const CARGOS = {
    // Base Militar
    1:  { nome: "I - INICIANTE", cor: "#5865f2", desc: "Recém-chegado ao sistema." },
    2:  { nome: "II - SOLDADO", cor: "#ffffff", desc: "Combatente formado." },
    3:  { nome: "III - CABO", cor: "#95a5a6", desc: "Auxiliar de comando." },
    4:  { nome: "IV - 3º SARGENTO", cor: "#bdc3c7", desc: "Primeira graduação de sargento." },
    5:  { nome: "V - 2º SARGENTO", cor: "#1abc9c", desc: "Graduado experiente." },
    6:  { nome: "VI - 1º SARGENTO", cor: "#2980b9", desc: "Graduado de elite." },
    7:  { nome: "VII - CAPITÃO", cor: "#3498db", desc: "Comandante de companhia." },
    8:  { nome: "IX - MAJOR", cor: "#27ae60", desc: "Oficial superior." }, // Pulou o VIII conforme o rascunho
    9:  { nome: "X - MARECHAL", cor: "#2ecc71", desc: "Posto militar máximo." },
    
    // Especial e Sócios (Braço Esquerdo)
    15: { nome: "SÓCIO", cor: "#9400d3", desc: "Parceiro investidor do sistema." },
    16: { nome: "ESPECIAL STAFF", cor: "#a29bfe", desc: "Equipe técnica braço esquerdo." },
    
    // Alta Cúpula (Poder Crescente)
    20: { nome: "3º AUTORIDADE", cor: "#daa520", desc: "Terceiro no comando geral." },
    21: { nome: "2º AUTORIDADE MÁXIMA", cor: "#ffd700", desc: "Vice-comando supremo." },
    22: { nome: "CESAR", cor: "#ff8c00", desc: "Alta cúpula administrativa." },
    23: { nome: "ANALITY", cor: "#ff4500", desc: "Cúpula de gestão absoluta." },
    25: { nome: "FUNDADOR", cor: "#ff0000", desc: "Autoridade Suprema e Criador." }
};

let userDados = null;

// --- NAVEGAÇÃO ---
window.mudarAba = (id) => {
    const abas = ['aba-chat', 'aba-membros', 'aba-perfil', 'aba-classes'];
    abas.forEach(aba => {
        const el = document.getElementById(aba);
        if (el) el.style.display = (aba === 'aba-' + id) ? 'block' : 'none';
    });
};

// --- MONITORAMENTO ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        onSnapshot(doc(db, "usuarios", user.uid), (snap) => {
            userDados = snap.data();
            if(!userDados) return;
            
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-site').style.display = 'flex';
            
            // ABA PERFIL
            const cargo = CARGOS[userDados.nivel] || CARGOS[1];
            document.getElementById('perfil-detalhes').innerHTML = `
                <div class="card">
                    <h2>${userDados.nome}</h2>
                    <p><b>Seu Cargo:</b> <span style="color:${cargo.cor}">${cargo.nome}</span></p>
                    <p><b>Nível de Poder:</b> ${userDados.nivel}</p>
                </div>
            `;
            
            // ABA CLASSES (Do menor para o maior)
            const listaClasses = document.getElementById('lista-classes');
            listaClasses.innerHTML = `
                <div class="regras-box">
                    <h3>📜 REGRAS DO SISTEMA</h3>
                    <ul>
                        <li>NÃO MENTIR</li>
                        <li>CRER EM DEUS</li>
                        <li>RESPEITAR SEU SUPERIOR</li>
                        <li>NÃO XINGAR</li>
                        <li>ACEITAR QUE PERDEU</li>
                    </ul>
                </div>
                <hr>
                <h3>HIERARQUIA (EVOLUÇÃO)</h3>
            `;
            
            // Pegar as chaves dos cargos, transformar em número e ordenar do menor pro maior
            Object.keys(CARGOS).map(Number).sort((a, b) => a - b).forEach(lvl => {
                const c = CARGOS[lvl];
                listaClasses.innerHTML += `
                    <div class="class-card" style="border-left: 5px solid ${c.cor}; margin-bottom: 8px;">
                        <span style="color:${c.cor}; font-weight:bold;">LVL ${lvl} - ${c.nome}</span><br>
                        <small style="color:#888;">${c.desc}</small>
                    </div>
                `;
            });
        });

        // LISTA DE MEMBROS
        onSnapshot(collection(db, "usuarios"), (snap) => {
            const lista = document.getElementById('lista-membros');
            if (!lista) return;
            lista.innerHTML = "";
            snap.forEach(d => {
                const u = d.data();
                const c = CARGOS[u.nivel] || CARGOS[1];
                lista.innerHTML += `
                    <div class="membro-item">
                        <span><b style="color:${c.cor}">[${c.nome}]</b> ${u.nome}</span>
                        ${userDados.nivel >= 20 && u.nivel < userDados.nivel ? `<button onclick="banirUser('${d.id}')">BANIR</button>` : ''}
                    </div>`;
            });
        });

        // CHAT
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

// Funções de Ação
document.getElementById('btn-enviar').onclick = async () => {
    const input = document.getElementById('msg-input');
    if(!input.value.trim()) return;
    await addDoc(collection(db, "mensagens"), {
        texto: input.value, nomeUsuario: userDados.nome, nivel: userDados.nivel, data: serverTimestamp()
    });
    input.value = "";
};

document.getElementById('btn-login').onclick = () => {
    signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('pass').value);
};

document.getElementById('btn-cadastro').onclick = async () => {
    const n = document.getElementById('username').value;
    const e = document.getElementById('email').value;
    const p = document.getElementById('pass').value;
    const res = await createUserWithEmailAndPassword(auth, e, p);
    await setDoc(doc(db, "usuarios", res.user.uid), { nome: n, email: e, nivel: 1, banido: false });
};

document.getElementById('btn-sair').onclick = () => signOut(auth).then(()=>location.reload());
window.banirUser = async (id) => { if(confirm("Deseja banir?")) await updateDoc(doc(db, "usuarios", id), { banido: true }); };