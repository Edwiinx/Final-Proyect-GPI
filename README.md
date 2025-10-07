# Final-Proyect---GPI
Proyecto sobre el foro de recepción de reportes ciudadanos para el aviso sobre problemas comunitarios (basura, falta de agua, falta de luz, etc.)

frontend/
├─ assets/
│  ├─ images/            # logos, íconos, ilustraciones (no subir grandes)
│  └─ fonts/             # fuentes locales (opcional)
├─ components/
│  ├─ header.html
│  ├─ footer.html
│  └─ process-card.html  # snippet HTML para cada proceso (plantilla)
├─ css/
│  ├─ styles.css         # tokens + layout + utilidades
│  ├─ components.css     # estilos de componentes
│  └─ responsive.css
├─ js/
│  ├─ app.js             # lógica principal (interacciones)
│  ├─ processes.js       # CRUD visual de procesos (cards)
│  └─ chat-widget.js     # integración Rasa más tarde (placeholder)
├─ pages/
│  ├─ index.html         # landing / menú
│  ├─ procesos.html      # "Realizar procesos" (pantalla principal)
│  ├─ seguimientos.html  # "Track / Consultar estado"
│  ├─ admin.html         # panel administrador (actualizar estado)
│  └─ docs.html          # documentación/guía de uso (para stakeholders)
├─ .gitignore
├─ README.md
└─ design/
   ├─ palette.md         # colores y tokens
   └─ wireframes/        # imágenes / PDFs de wireframes (opcional)
