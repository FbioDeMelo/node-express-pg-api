require('dotenv').config();//carrega as variaveis de ambiente do .env
const express = require("express");//lib para criar a aplicação
const app = express();//criando a aplicação
const port = process.env.PORT || 3000;//porta que o servidor vai rodar
const cors = require('cors');//lib para permitir que o front-end acesse o back-end
app.use(cors());//permite que o front-end acesse o back-end
app.use(express.static('public'));//permite que o front-end acesse os arquivos estaticos
app.use(express.json());//para formatsr json
const { Pool } = require('pg');//lib para conectar ao banco de dados

const pool = new Pool({
    user: process.env.DB_USER,//usuario do banco de dados
    host: process.env.DB_HOST,//host do banco de dados
    database: process.env.DB_NAME,//banco de dados
    password: process.env.DB_PASSWORD,//senha do banco de dados
    port: process.env.DB_PORT,//porta do banco de dados
});
//Metodo get para listar todos os usuarios
app.get('/users', async (req, res) => {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    try {
        const [dataResult, countResult] = await Promise.all([
            pool.query('SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]),
            pool.query('SELECT COUNT(*) FROM users')
        ]);
        const total = parseInt(countResult.rows[0].count);
        res.json({
            users: dataResult.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit) || 1
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Metodo get para buscar um usuario por ID
app.get('/users/:id', async (req, res) => {
    const id = Number(req.params.id);

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Usuario nao encontrado" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Metodo post para salvar os usuarios na memoria 
app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    //tenta inserir o usuario no banco de dados
    try {
        const result = await pool.query(
            'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );
        //retorna o usuario criado
        res.status(201).json({
            message: "Usuario criado com sucesso!",
            user: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//Metodo delete para deletar os usuarios cadastrados na memoria
app.delete('/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    //tenta deletar o usuario no banco de dados
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING *',
            [id]
        );
        //caso o usuario nao seja encontrado
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Usuario nao encontrado" });
        }
        //retorna o usuario deletado
        res.json({ message: "Usuario deletado com sucesso!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
//Metodo put para atualizar os usuarios cadastrados na memoria
app.put('/users/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { name, email } = req.body;
    //tenta atualizar o usuario
    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
            [name, email, id]
        );
        //caso o usuario nao seja encontrado
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Usuario nao encontrado" });
        }
        //retorna o usuario atualizado
        res.json({
            message: "Usuario atualizado com sucesso!",
            user: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});