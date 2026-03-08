import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate environment variables
const requiredEnv = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "DATABASE_URL", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((env) => !process.env[env]);
if (missingEnv.length > 0) {
  console.error(`❌ Erro: Variáveis de ambiente faltando: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Database connection
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Não autorizado" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Token inválido" });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.perfil !== 'admin') {
      return res.status(403).json({ error: "Acesso negado: Requer perfil de administrador" });
    }
    next();
  };

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/login", async (req, res) => {
    const { email, senha } = req.body;
    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) {
        return res.status(401).json({ error: authError.message });
      }

      // 2. Fetch user from 'usuarios' table
      const [user] = await sql`SELECT * FROM usuarios WHERE email = ${email}`;

      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado na base de dados do sistema. Entre em contato com o administrador." });
      }

      // 3. Validate status
      if (user.status !== 'ativo') {
        return res.status(403).json({ error: "Sua conta está inativa. Acesso bloqueado." });
      }

      // 4. Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, perfil: user.perfil, nome: user.nome },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: { id: user.id, email: user.email, nome: user.nome, perfil: user.perfil }
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: `Erro no login: ${err.message || "Erro interno no servidor"}` });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", authenticate, async (req, res) => {
    try {
      const [cautelasAtivas] = await sql`SELECT COUNT(*) as count FROM cautelas WHERE status = 'ativa'`;
      const [cautelasDevolvidas] = await sql`SELECT COUNT(*) as count FROM cautelas WHERE status = 'devolvida'`;
      const [cautelasAtrasadas] = await sql`SELECT COUNT(*) as count FROM cautelas WHERE status = 'ativa' AND data_prevista_devolucao < CURRENT_TIMESTAMP`;
      const [chavesDisponiveis] = await sql`SELECT COUNT(*) as count FROM chaves WHERE status = 'disponível'`;
      const [chavesEmUso] = await sql`SELECT COUNT(*) as count FROM chaves WHERE status = 'em uso'`;
      const [tecnicosAtivos] = await sql`SELECT COUNT(*) as count FROM tecnicos WHERE status = 'ativo'`;
      const [empresas] = await sql`SELECT COUNT(*) as count FROM empresas`;

      const ultimasMovimentacoes = await sql`
        SELECT h.*, u.nome as usuario_nome 
        FROM historico_movimentacoes h 
        LEFT JOIN usuarios u ON h.usuario_id = u.id 
        ORDER BY h.criado_em DESC LIMIT 10
      `;

      res.json({
        cautelasAtivas: parseInt(cautelasAtivas.count),
        cautelasDevolvidas: parseInt(cautelasDevolvidas.count),
        cautelasAtrasadas: parseInt(cautelasAtrasadas.count),
        chavesDisponiveis: parseInt(chavesDisponiveis.count),
        chavesEmUso: parseInt(chavesEmUso.count),
        tecnicosAtivos: parseInt(tecnicosAtivos.count),
        empresas: parseInt(empresas.count),
        ultimasMovimentacoes
      });
    } catch (err: any) {
      console.error("Stats error:", err);
      res.status(500).json({ error: `Erro ao buscar estatísticas: ${err.message}` });
    }
  });

  // Companies
  app.get("/api/companies", authenticate, async (req, res) => {
    const companies = await sql`SELECT * FROM empresas ORDER BY nome ASC`;
    res.json(companies);
  });

  app.post("/api/companies", authenticate, isAdmin, async (req: any, res) => {
    const { nome, cnpj, telefone, email, status } = req.body;
    try {
      const [result] = await sql`
        INSERT INTO empresas (nome, cnpj, telefone, email, status) 
        VALUES (${nome}, ${cnpj}, ${telefone}, ${email}, ${status || 'ativo'}) 
        RETURNING id
      `;
      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('empresa', ${result.id}, 'criacao', ${`Empresa ${nome} cadastrada`}, ${req.user.id})`;
      res.json(result);
    } catch (err: any) {
      console.error("Create company error:", err);
      res.status(500).json({ error: `Erro ao cadastrar empresa: ${err.message}` });
    }
  });

  app.put("/api/companies/:id", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { nome, cnpj, telefone, email, status } = req.body;
    try {
      await sql`
        UPDATE empresas 
        SET nome = ${nome}, cnpj = ${cnpj}, telefone = ${telefone}, email = ${email}, status = ${status}
        WHERE id = ${id}
      `;
      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('empresa', ${id}, 'edicao', ${`Empresa ${nome} atualizada`}, ${req.user.id})`;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Update company error:", err);
      res.status(500).json({ error: `Erro ao atualizar empresa: ${err.message}` });
    }
  });

  app.delete("/api/companies/:id", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    try {
      await sql`DELETE FROM empresas WHERE id = ${id}`;
      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('empresa', ${id}, 'exclusao', 'Empresa excluída', ${req.user.id})`;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao excluir empresa. Verifique se existem técnicos vinculados." });
    }
  });

  // Technicians
  app.get("/api/technicians", authenticate, async (req, res) => {
    const technicians = await sql`
      SELECT t.*, e.nome as empresa_nome, r.nome as regional_nome
      FROM tecnicos t 
      LEFT JOIN empresas e ON t.empresa_id = e.id
      LEFT JOIN regionais r ON t.regional_id = r.id
      ORDER BY t.nome ASC
    `;
    res.json(technicians);
  });

  app.post("/api/technicians", authenticate, isAdmin, async (req: any, res) => {
    const { nome, cpf, telefone, empresa_id, regional_id, status } = req.body;
    try {
      const [result] = await sql`
        INSERT INTO tecnicos (nome, cpf, telefone, empresa_id, regional_id, status) 
        VALUES (${nome}, ${cpf}, ${telefone}, ${empresa_id}, ${regional_id}, ${status || 'ativo'}) 
        RETURNING id
      `;
      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('tecnico', ${result.id}, 'criacao', ${`Técnico ${nome} cadastrado`}, ${req.user.id})`;
      res.json(result);
    } catch (err: any) {
      console.error("Create technician error:", err);
      res.status(500).json({ error: `Erro ao cadastrar técnico: ${err.message}` });
    }
  });

  app.put("/api/technicians/:id", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { nome, cpf, telefone, empresa_id, regional_id, status } = req.body;
    try {
      await sql`
        UPDATE tecnicos 
        SET nome = ${nome}, cpf = ${cpf}, telefone = ${telefone}, empresa_id = ${empresa_id}, regional_id = ${regional_id}, status = ${status}
        WHERE id = ${id}
      `;
      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('tecnico', ${id}, 'edicao', ${`Técnico ${nome} atualizado`}, ${req.user.id})`;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Update technician error:", err);
      res.status(500).json({ error: `Erro ao atualizar técnico: ${err.message}` });
    }
  });

  app.delete("/api/technicians/:id", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    try {
      await sql`DELETE FROM tecnicos WHERE id = ${id}`;
      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('tecnico', ${id}, 'exclusao', 'Técnico excluído', ${req.user.id})`;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao excluir técnico. Verifique se existem cautelas vinculadas." });
    }
  });

  // Keys
  app.get("/api/keys", authenticate, async (req, res) => {
    const keys = await sql`SELECT * FROM vw_chaves_completa ORDER BY codigo ASC`;
    res.json(keys);
  });

  app.post("/api/keys", authenticate, isAdmin, async (req: any, res) => {
    const { codigo, modelo, tipo, regional_id, local_id, status, observacoes } = req.body;
    try {
      const [result] = await sql`
        INSERT INTO chaves (codigo, modelo, tipo, regional_id, local_id, status, observacoes) 
        VALUES (${codigo}, ${modelo}, ${tipo}, ${regional_id}, ${local_id}, ${status || 'disponível'}, ${observacoes}) 
        RETURNING id
      `;
      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('chave', ${result.id}, 'criacao', ${`Chave ${codigo} cadastrada`}, ${req.user.id})`;
      res.json(result);
    } catch (err: any) {
      console.error("Create key error:", err);
      res.status(500).json({ error: `Erro ao cadastrar chave: ${err.message}` });
    }
  });

  app.put("/api/keys/:id", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { codigo, modelo, tipo, regional_id, local_id, status, observacoes } = req.body;
    try {
      await sql`
        UPDATE chaves 
        SET codigo = ${codigo}, modelo = ${modelo}, tipo = ${tipo}, regional_id = ${regional_id}, local_id = ${local_id}, status = ${status}, observacoes = ${observacoes}
        WHERE id = ${id}
      `;
      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('chave', ${id}, 'edicao', ${`Chave ${codigo} atualizada`}, ${req.user.id})`;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Update key error:", err);
      res.status(500).json({ error: `Erro ao atualizar chave: ${err.message}` });
    }
  });

  app.delete("/api/keys/:id", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    try {
      await sql`DELETE FROM chaves WHERE id = ${id}`;
      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('chave', ${id}, 'exclusao', 'Chave excluída', ${req.user.id})`;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Erro ao excluir chave. Verifique se existem cautelas vinculadas." });
    }
  });

  // Cautelas
  app.get("/api/cautelas", authenticate, async (req, res) => {
    const cautelas = await sql`SELECT * FROM vw_cautelas_completa ORDER BY data_retirada DESC`;
    res.json(cautelas);
  });

  app.post("/api/cautelas", authenticate, async (req: any, res) => {
    const { tecnico_id, chave_id, empresa_id, regional_id, crq, observacoes, data_prevista_devolucao } = req.body;
    
    try {
      // Check if key is available
      const [key] = await sql`SELECT status FROM chaves WHERE id = ${chave_id}`;
      if (!key || key.status !== 'disponível') {
        return res.status(400).json({ error: "Chave não disponível para cautela" });
      }

      // Check if technician is active
      const [tech] = await sql`SELECT status FROM tecnicos WHERE id = ${tecnico_id}`;
      if (!tech || tech.status !== 'ativo') {
        return res.status(400).json({ error: "Técnico inativo ou bloqueado" });
      }

      const [result] = await sql`
        INSERT INTO cautelas (tecnico_id, chave_id, empresa_id, regional_id, crq, observacoes, data_prevista_devolucao, usuario_id, status) 
        VALUES (${tecnico_id}, ${chave_id}, ${empresa_id}, ${regional_id}, ${crq}, ${observacoes}, ${data_prevista_devolucao}, ${req.user.id}, 'ativa') 
        RETURNING id
      `;

      // Update key status
      await sql`UPDATE chaves SET status = 'em uso' WHERE id = ${chave_id}`;

      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('cautela', ${result.id}, 'retirada', ${`Retirada de chave vinculada à cautela ${result.id}`}, ${req.user.id})`;
      
      res.json(result);
    } catch (err: any) {
      console.error("Create cautela error:", err);
      res.status(500).json({ error: `Erro ao abrir cautela: ${err.message}` });
    }
  });

  app.post("/api/cautelas/:id/return", authenticate, async (req: any, res) => {
    const { id } = req.params;
    try {
      const [cautela] = await sql`SELECT * FROM cautelas WHERE id = ${id}`;
      if (!cautela || cautela.status === 'devolvida') {
        return res.status(400).json({ error: "Cautela inválida ou já devolvida" });
      }

      await sql`UPDATE cautelas SET status = 'devolvida', data_devolucao = CURRENT_TIMESTAMP WHERE id = ${id}`;
      await sql`UPDATE chaves SET status = 'disponível' WHERE id = ${cautela.chave_id}`;

      await sql`INSERT INTO historico_movimentacoes (tipo_entidade, entidade_id, acao, descricao, usuario_id) VALUES ('cautela', ${id}, 'devolucao', ${`Devolução de chave da cautela ${id}`}, ${req.user.id})`;

      res.json({ success: true });
    } catch (err: any) {
      console.error("Return cautela error:", err);
      res.status(500).json({ error: `Erro ao registrar devolução: ${err.message}` });
    }
  });

  // Users Management (Admin Only)
  app.get("/api/users", authenticate, isAdmin, async (req, res) => {
    const users = await sql`SELECT id, nome, email, perfil, status, criado_em FROM usuarios ORDER BY nome ASC`;
    res.json(users);
  });

  app.post("/api/users", authenticate, isAdmin, async (req: any, res) => {
    const { nome, email, perfil, status } = req.body;
    try {
      const [result] = await sql`
        INSERT INTO usuarios (nome, email, perfil, status) 
        VALUES (${nome}, ${email}, ${perfil}, ${status || 'ativo'}) 
        RETURNING id
      `;
      res.json(result);
    } catch (err: any) {
      console.error("Create user error:", err);
      res.status(500).json({ error: `Erro ao cadastrar usuário: ${err.message}` });
    }
  });

  app.put("/api/users/:id", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { nome, email, perfil, status } = req.body;
    try {
      await sql`
        UPDATE usuarios 
        SET nome = ${nome}, email = ${email}, perfil = ${perfil}, status = ${status}
        WHERE id = ${id}
      `;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Update user error:", err);
      res.status(500).json({ error: `Erro ao atualizar usuário: ${err.message}` });
    }
  });

  app.patch("/api/users/:id/status", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await sql`UPDATE usuarios SET status = ${status} WHERE id = ${id}`;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Update user status error:", err);
      res.status(500).json({ error: `Erro ao atualizar status do usuário: ${err.message}` });
    }
  });

  app.delete("/api/users/:id", authenticate, isAdmin, async (req: any, res) => {
    const { id } = req.params;
    try {
      // Don't allow deleting yourself
      if (id === req.user.id) {
        return res.status(400).json({ error: "Você não pode excluir seu próprio usuário" });
      }
      await sql`DELETE FROM usuarios WHERE id = ${id}`;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Delete user error:", err);
      res.status(500).json({ error: `Erro ao excluir usuário: ${err.message}` });
    }
  });

  // History
  app.get("/api/history", authenticate, async (req, res) => {
    const history = await sql`
      SELECT h.*, u.nome as usuario_nome 
      FROM historico_movimentacoes h 
      LEFT JOIN usuarios u ON h.usuario_id = u.id 
      ORDER BY h.criado_em DESC
    `;
    res.json(history);
  });

  // Aux Tables
  app.get("/api/regionais", authenticate, async (req, res) => {
    res.json(await sql`SELECT * FROM regionais ORDER BY nome ASC`);
  });

  app.get("/api/locais", authenticate, async (req, res) => {
    res.json(await sql`SELECT * FROM locais ORDER BY nome ASC`);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();

