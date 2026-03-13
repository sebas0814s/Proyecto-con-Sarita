# 🐍 Snake — Proyecto con Sara

Juego de la culebra hecho con HTML, CSS y JavaScript puro.  
Organizado con **un archivo por responsabilidad** para aprender buenas prácticas.

---

## Estructura del proyecto

```
PROYECTO CON SARA/
├── index.html          ← Punto de entrada (solo abre esto en el navegador)
├── styles/
│   └── main.css        ← Todos los estilos visuales
└── src/
    ├── game.js         ← Bucle principal, orquesta todo
    ├── board.js        ← Canvas: dibujar tablero, culebra, comida
    ├── snake.js        ← Lógica de la culebra (mover, colisionar)
    ├── food.js         ← Lógica de la comida (aparecer, detectar si fue comida)
    ├── input.js        ← Teclado y gestos táctiles
    ├── score.js        ← Puntaje y récord (guardado en localStorage)
    └── ui.js           ← Cambiar pantallas y textos del DOM
```

## Cómo ejecutar

1. Abre `index.html` directamente en el navegador, **o**
2. Usa la extensión **Live Server** de VS Code para recargado automático.

> ⚠️ Los módulos ES (`type="module"`) no funcionan abriendo el archivo con doble clic en algunos navegadores. Con Live Server funciona perfecto.

---

## Controles

| Tecla              | Acción           |
|--------------------|------------------|
| ↑ ↓ ← →  /  WASD  | Mover la culebra |
| P                  | Pausar / Reanudar|
| Deslizar (móvil)   | Mover la culebra |

---

# 🌿 Guía de Git — Control de versiones

Git es una herramienta que guarda el historial de cambios de tu proyecto.  
Piénsalo como un "Ctrl+Z" ilimitado que además permite trabajar en equipo.

---

## Conceptos clave

| Concepto     | Qué es                                                          |
|--------------|-----------------------------------------------------------------|
| **Repositorio** | La carpeta del proyecto bajo control de Git               |
| **Commit**      | Una "foto" guardada del estado del proyecto               |
| **Branch**      | Una línea de trabajo paralela (como una copia de seguridad)|
| **Staging**     | La "sala de espera" antes de hacer commit                 |
| **Remote**      | El repositorio en la nube (GitHub, GitLab, etc.)          |

---

## Flujo de trabajo diario

```bash
# 1. Ver qué cambió
git status

# 2. Agregar los archivos que quieres guardar
git add .                        # agrega TODOS los cambios
git add src/snake.js             # agrega solo un archivo

# 3. Guardar la foto (commit)
git commit -m "Descripción clara de lo que hiciste"

# 4. Subir al repositorio en la nube
git push
```

---

## Comandos esenciales

```bash
# ── Configuración inicial (solo una vez) ──
git config --global user.name  "Tu Nombre"
git config --global user.email "tu@email.com"

# ── Iniciar un repositorio nuevo ──
git init

# ── Ver historial de commits ──
git log --oneline

# ── Ver qué cambió en detalle ──
git diff

# ── Deshacer cambios NO commiteados ──
git checkout -- nombre-del-archivo.js

# ── Crear y cambiar a una rama nueva ──
git checkout -b nombre-de-la-rama

# ── Cambiar entre ramas ──
git checkout main

# ── Unir una rama con la principal ──
git merge nombre-de-la-rama

# ── Clonar un proyecto existente ──
git clone https://github.com/usuario/repositorio.git

# ── Traer cambios del repositorio remoto ──
git pull
```

---

## Flujo en equipo (Sebastián + Sara)

```
main (rama principal - siempre funciona)
 │
 ├── feature/pantalla-de-inicio   ← Sara trabaja aquí
 └── feature/sonidos              ← Sebastián trabaja aquí
```

```bash
# Sara empieza una nueva función
git checkout -b feature/pantalla-de-inicio
# ... hace cambios ...
git add .
git commit -m "Agrega pantalla de inicio animada"
git push origin feature/pantalla-de-inicio
# Luego crea un Pull Request en GitHub para revisar juntos
```

---

## Comandos para este proyecto

```bash
# Inicializar Git en este proyecto
cd "PROYECTO CON SARA"
git init
git add .
git commit -m "Primer commit: juego snake base"

# Conectar con GitHub
git remote add origin https://github.com/tu-usuario/proyecto-con-sara.git
git push -u origin main
```

---

## Tips

- **Commitea seguido**: cada vez que algo funciona, haz un commit.
- **Mensajes claros**: `"Agrega detección de colisiones"` es mejor que `"cambios"`.
- **No commitees lo que no funciona** en `main`; usa ramas para experimentar.
- **`.gitignore`**: lista de archivos que Git ignora (contraseñas, carpetas de sistema, etc.).
