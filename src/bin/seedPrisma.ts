import { saveUsers } from "./saveUsersData";
import { loadFamiliares } from "./loadFamiliares";
import { loadEquipos } from "./loadEquipos";
import { loadScouts } from "./loadScouts";
import { loadPagos } from "./loadPagos";
import { loadDocumentos } from "./loadDocumentos";
import { loadEntregas } from "./loadEntregas";

const seedPrisma = async () => {
    await saveUsers();
    await loadFamiliares();
    await loadEquipos();
    await loadScouts();
    await loadPagos();
    await loadDocumentos();
    await loadEntregas();
};

seedPrisma();