import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Studio City app root was not found.');
}

app.innerHTML = '<h1>welcome to studio city</h1>';
