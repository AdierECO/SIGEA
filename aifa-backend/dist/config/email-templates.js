"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordEmailTemplate = void 0;
const forgotPasswordEmailTemplate = (password) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña en ContApp</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Gabarito&family=Josefin+Sans:wght@300&family=Staatliches&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Josefin Sans', sans-serif;
            background-color: #f4f4f4;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        table {
            width: 100%;
            margin: 0 auto;
            background-color: white;
            flex-grow: 1;
        }
        h2 {
            font-family: 'Staatliches', sans-serif;
            color: #63000A;
            font-size: 35px;
        }
        p {
            font-family: 'Josefin Sans', sans-serif;
            color: #333;
            font-size: 25px;
        }
        a {
            display: inline-block;
            padding: 12px 24px;
            background-color: #63000A;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-family: 'Staatliches', sans-serif;
            margin-top: 20px;
        }
        .header, .footer {
            background-color: #63000A;
            color: white;
            text-align: center;
            padding: 40px;
        }
        .content {
            text-align: center;
            padding: 30px 20px;
        }
        .footer {
            text-align: left;
            padding: 20px;
        }
        .footer h4 {
            margin: 0;
            font-size: 14px;
            padding-left: 20px;
        }
        @media screen and (max-width: 600px) {
            .header, .footer {
                padding: 20px;
            }
            h2 {
                font-size: 50px;
            }
            p {
                font-size: 35px;
            }
            a {
                padding: 10px 20px;
                font-size: 25px;
            }
            .footer h4 {
                font-size: 12px;
            }
        }
    </style>
</head>
<body>
    <table cellpadding="0" cellspacing="0">
        <tr>
            <td class="header">
                <h1 style="margin: 0;">MAEKA</h1>
            </td>
        </tr>
        <tr>
            <td class="content">
                <h2>La contraseña de tu usuario ahora es:</h2>
                <p>${password}</p> 
                <br>
                <p>Por favor no olvides cambiar tu contraseña al ingresar de nuevo a tu cuenta</p>
                
            </td>
        </tr>
    </table>
    <div class="footer">
        <h4>Todos los derechos reservados</h4>
        <h4>Butrón Sánchez Kevin Nathanael</h4>
        <h4>Gayosso Vargas Mariluz</h4>
        <h4>Martínez Delgado Arturo</h4>
        <h4>García Vazquez Axel Enrique @_AxlEnr</h4>
        <h4>Ortiz Cabrera Erick Adier @_Artix</h4>
    </div>
</body>
</html>`;
exports.forgotPasswordEmailTemplate = forgotPasswordEmailTemplate;
//# sourceMappingURL=email-templates.js.map