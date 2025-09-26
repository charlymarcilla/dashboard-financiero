# Plan de Desarrollo: Dashboard Financiero

Este documento describe los pasos y funcionalidades a implementar en el proyecto.

## Mejoras Implementadas (Sesión del 25/09/2025)

- **Sistema de Notificaciones Completo:**
  - [x] Alerta para metas de ahorro completadas.
  - [x] Alerta para transacciones recurrentes próximas a vencer.
  - [x] Alerta para presupuestos mensuales excedidos.

- **Exportación de Datos a PDF:**
  - [x] Se implementó la exportación a PDF para los reportes de ingresos y gastos, utilizando `jspdf` y `jspdf-autotable`.

- **Mejoras de Interfaz y Usabilidad (UI/UX):**
  - [x] Se corrigió la funcionalidad de reordenar módulos en el dashboard.
  - [x] Se mejoró la visibilidad del control para arrastrar y soltar (drag-and-drop).

- **Correcciones y Mantenimiento:**
  - [x] Solucionado un error crítico de runtime al no encontrar las variables de entorno de Supabase.
  - [x] Reestructurado el repositorio de Git para alinear la raíz del proyecto con la del repositorio.
  - [x] Limpieza de archivos generados e innecesarios.

---

## Fases de Desarrollo

1.  **Soporte para Múltiples Cuentas:**
    - [x] Creación/Edición/Eliminación de cuentas (Ej: Banco, Efectivo, Tarjeta de Crédito).
    - [x] Asignación de transacciones a cuentas específicas.
    - [x] Visualización de saldos por cuenta y total.

2.  **Transacciones Recurrentes:**
    - [x] Interfaz para crear transacciones que se repiten (diaria, semanal, mensual, anual).
    - [x] Lógica para generar automáticamente las transacciones en las fechas correspondientes.
    - [x] Vista para gestionar y cancelar transacciones recurrentes activas.

3.  **Metas de Ahorro:**
    - [x] Interfaz para definir metas de ahorro con nombre, objetivo de monto y fecha límite.
    - [x] Visualización del progreso de cada meta.
    - [x] Posibilidad de "depositar" dinero en una meta (creando una transacción de gasto especial).

4.  **Filtros Avanzados y Reportes:**
    - [x] Mejorar los filtros actuales (rango de fechas, categoría, cuenta).
    - [x] Crear una página o sección de "Reportes".
    - [x] Generar reportes visuales (gráficos) y en formato de tabla de:
        - Gastos por categoría en un período.
        - Evolución del patrimonio neto a lo largo del tiempo.
        - Flujo de caja (ingresos vs. gastos) mensual.

5.  **Notificaciones y Alertas:**
    - [x] Alertas por email o en la app sobre presupuestos excedidos.
    - [x] Recordatorios de transacciones recurrentes próximas a generarse.
    - [x] Notificaciones sobre el progreso en las metas de ahorro.

6.  **Dashboard Personalizable:**
    - [x] Permitir al usuario reorganizar los componentes del dashboard (arrastrar y soltar).
    - [x] Permitir al usuario mostrar/ocultar ciertos widgets.

7.  **Análisis Inteligente:**
    - [x] Identificar patrones de gasto inusuales.
    - [x] Sugerir áreas donde el usuario podría ahorrar.
    - [x] Ofrecer resúmenes automáticos del estado financiero del mes.

8.  **Gestión de Deudas y Formas de Pago (En progreso):**
    - [ ] **Fase 1: Módulo de Deudas (La Base):**
        - [ ] Crear tabla `deudas` en Supabase para registrar préstamos, compras en cuotas, etc.
        - [ ] Crear componente `GestionarDeudas.tsx` para añadir, ver y eliminar deudas.
        - [ ] Crear un widget `Deudas.tsx` para el dashboard que muestre un resumen de la deuda total y el progreso de cada una.
    - [ ] **Fase 2: Integración con Transacciones:**
        - [ ] Implementar la funcionalidad "Pagar Cuota" que genere un gasto y actualice el saldo de la deuda.
        - [ ] Añadir el campo "Forma de Pago" (efectivo, débito, crédito) en el formulario de gastos.
        - [ ] Conectar la creación de un gasto a cuotas con el nuevo módulo de deudas.


## Mejoras Propuestas Anteriores

### Flexibilidad en Transacciones Recurrentes

**Problema:** La definición actual de transacciones recurrentes no permite flexibilidad en la fecha de pago real ni en la asignación de la cuenta de pago, ya que estos pueden variar respecto a la fecha de vencimiento.

**Solución Propuesta:**
1.  **Definición de Recurrencia como Plantilla:** La transacción recurrente se define como una plantilla con descripción, monto, tipo, frecuencia y fechas de inicio/fin. La cuenta y la categoría serían opcionales en esta definición inicial.
2.  **Generación Automática de Transacciones Pendientes:** Un proceso en segundo plano (ej. función de Supabase) generaría transacciones 'pendientes' en la tabla `transacciones` cuando una recurrencia esté próxima a vencer. Estas transacciones tendrían la fecha de vencimiento como su fecha y un estado 'pendiente'.
3.  **Confirmación y Asignación Manual:** El usuario podría 'completar' estas transacciones pendientes desde el dashboard. Al hacerlo, se abriría un formulario de edición donde podría:
    *   Confirmar la fecha real de pago.
    *   Asignar la cuenta de pago real.
    *   Confirmar o cambiar la categoría.
    *   Marcar la transacción como 'pagada'.

Esto permitiría una mayor flexibilidad y reflejaría mejor el flujo de trabajo real de los pagos recurrentes.