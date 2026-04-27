import { saveUsers } from "./seed/saveUsersData";
import { loadFamiliares } from "./seed/loadFamiliares";
import { loadEquipos } from "./seed/loadEquipos";
import { loadScouts } from "./seed/loadScouts";
import { loadPagos } from "./seed/loadPagos";
import { loadReglasPago } from "./seed/loadReglasPago";
import { loadDocumentos } from "./seed/loadDocumentos";
import { loadEntregas } from "./seed/loadEntregas";
import { initPrisma } from "../utils/lib/prisma-client";
import { SecretsManager } from "../utils/classes/SecretsManager";
import { ServicioObligacionesPago } from "../services/servicioObligacionesPago";

const seedDB = async () => {
    await SecretsManager.getInstance().initialize();
    await initPrisma();
    await saveUsers();
    await loadFamiliares();
    await loadEquipos();
    await loadScouts();
    await loadReglasPago();
    await loadPagos();
    await new ServicioObligacionesPago().backfillDesdeCicloActivo();
    await loadDocumentos();
    await loadEntregas();
};

seedDB();