import { useState } from "react";
import TopNav from "./components/TopNav.jsx";
import SyllabusPage from "./pages/SyllabusPage.jsx";
import ChallengePage from "./pages/ChallengePage.jsx";

export default function App() {
  const [page, setPage] = useState("syllabus");

  return (
    <div className="app">
      <TopNav page={page} onChange={setPage} />
      {page === "syllabus" ? <SyllabusPage /> : <ChallengePage />}
    </div>
  );
}
