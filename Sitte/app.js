import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const CARGOS = { 10: "Fundador", 9: "Diretor", 1: "Recruta" }; // Adicione os outros aqui

// Cadastro
document.getElementById('btn-cadastro').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "usuarios", res.user.uid), { email, nivel: 1, xp: 0 });
    alert("Cadastrado!");
};

// Login
document.getElementById('btn-login').onclick = () => {
    signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('pass').value);
};

// Gerenciamento de Estado
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-site').style.display = 'flex';
        const p = await getDoc(doc(db, "usuarios", user.uid));
        window.userData = p.data();
        if(window.userData.nivel >= 9) document.getElementById('btn-admin').style.display = 'block';
    }
});

// Sistema de Missões (Minigame)
window.mudarAba = (aba) => {
    const display = document.getElementById('aba-display');
    if(aba === 'missoes') {
        display.innerHTML = `
            <div class="game-card">
                <h3>Minigame da Semana</h3>
                <p>Ganhe 100 XP agora!</p>
                <button onclick="completarMissao()">JOGAR</button>
            </div>`;
    } else {
        display.innerHTML = `<h2>Aba: ${aba}</h2><p>Conteúdo em breve...</p>`;
    }
};

window.completarMissao = async () => {
    const novoXP = (window.userData.xp || 0) + 100;
    await updateDoc(doc(db, "usuarios", auth.currentUser.uid), { xp: novoXP });
    alert("XP Ganho!");
    location.reload();
};