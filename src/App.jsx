import ProfitSplit from './components/ProfitSplit.jsx';
import styles from './App.module.css';

function App() {
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>
        Interactive Profit Split — Founders (Yoni+Spence), Laura, Damon
      </h1>
      <p className={styles.subtitle}>
        Based on capital-days and a 20% carry on Laura &amp; Damon profits (carry goes to Founders). Damon can be toggled as
        deployed or not.
      </p>
      <ProfitSplit />
    </main>
  );
}

export default App;
