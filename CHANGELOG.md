# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## 1.0.0-beta.1 (2026-06-06)


### Features

* :sparkles: reordenar la tarjeta de tsumego ([9792869](https://github.com/raultm/engrama/commit/9792869e7dff01a3bbbbadc7c619134dfd9f1ecd))
* botón de actualización PWA + icono Engrama como favicon y app icon ([1d15492](https://github.com/raultm/engrama/commit/1d15492a37dcee947ded1ff4a449e34069ca21cc)), closes [#bd93f9](https://github.com/raultm/engrama/issues/bd93f9)
* filtro de tags por pastillas y corrección de botones de calificación ([5feb1d0](https://github.com/raultm/engrama/commit/5feb1d0cf45aa9311b8cda2a8b7c4ba8987ae610))
* filtro de tags por pastillas y corrección de botones de calificación ([91a5c7a](https://github.com/raultm/engrama/commit/91a5c7adf43e98434d080de623840917fb0f3d7e))
* GoBoard visual — snap a 2 bordes + borde sólido/discontinuo + degradados en cortes ([b36e644](https://github.com/raultm/engrama/commit/b36e644cc410750ef9c28642b1f83a6400f1c30a))
* historial de sesiones con gráfico de evolución del ELO ([e969ca2](https://github.com/raultm/engrama/commit/e969ca2ddb3dfaabf577fc377de0fd629fa6f592))
* imágenes en tarjetas básicas de Anki ([7f6be0c](https://github.com/raultm/engrama/commit/7f6be0ce87359b626320b891888ba05e2ddbbb71))
* intervalos adaptativos por fecha límite + próxima revisión en home ([750b3e9](https://github.com/raultm/engrama/commit/750b3e9a5f3368c6008b9e66ce77cca62b64c375))
* leer ELO y estado bloqueado desde etiquetas de Anki ([6eef441](https://github.com/raultm/engrama/commit/6eef441b039ea53cb787675a3f871f8dd78afd91))
* multi-type flashcard system with Anki .apkg import ([ae79964](https://github.com/raultm/engrama/commit/ae79964acf07c22af1242a3a199b33b5c0bc04f2))
* nuevo tipo de tarjeta tsumego con tablero de Go interactivo ([cb0b9db](https://github.com/raultm/engrama/commit/cb0b9db884c60f6f80519d9ab65531aa3526b870))
* persistir sesiones de estudio y re-cola estilo Anki ([f14be7e](https://github.com/raultm/engrama/commit/f14be7e9677f388f7f52fd0eba21cb83757d29f0))
* preguntar fecha límite del temario tras importar cualquier mazo ([2d0c89d](https://github.com/raultm/engrama/commit/2d0c89da00f03ba792be1390eb24cabbb9f8b442))
* PWA con Service Worker para acceso offline ([ace6c7a](https://github.com/raultm/engrama/commit/ace6c7a4f024e135ff155347d38dbdfdc0e20243)), closes [#bd93f9](https://github.com/raultm/engrama/issues/bd93f9) [#21222](https://github.com/raultm/engrama/issues/21222)
* racha de días consecutivos estudiando ([7c39d90](https://github.com/raultm/engrama/commit/7c39d90ee67d08e5bffd9272f0e68869dadca279))
* sincronización de sesiones con backend de clase ([1c67029](https://github.com/raultm/engrama/commit/1c670294078d833dca55908340f107a1254e0dc9))
* soporte Tsumego desde Anki + docs de importación ([88b5765](https://github.com/raultm/engrama/commit/88b5765d9928fae47e14ddcc8a569990087671c2))
* título en tsumego, filtro AND/OR de tags y safe area para notch ([b4bdbc8](https://github.com/raultm/engrama/commit/b4bdbc838a75818a9a15204169e99af963732fdb))
* tsumego review mode con navegación y anotaciones del árbol SGF ([e5d6b11](https://github.com/raultm/engrama/commit/e5d6b112aa01723ed06dea489ec46f76d6070264))
* tsumego sin botonera forzada + acceso por ventana ELO ([f82372f](https://github.com/raultm/engrama/commit/f82372fe2f4407b2e790d0d267c925f497eb7e38))
* versión inicial de Engrama v1.0.0 ([2c99ee4](https://github.com/raultm/engrama/commit/2c99ee467c0eeab6d28337dce45861311b41b603))


### Bug Fixes

* :lipstick: eliminar scroll en movil durante sesiones de estudio ([a724a10](https://github.com/raultm/engrama/commit/a724a1083a02d70dcac2cc2deb0bd3f7a92dbcd3))
* actualización PWA más robusta en iOS — reload explícito y timeout de seguridad ([f0d925c](https://github.com/raultm/engrama/commit/f0d925c9882d096a054c9ccf19bb6be4722ddc73))
* botonera fija en móvil y sin salto de línea en desktop ([82a998f](https://github.com/raultm/engrama/commit/82a998f38ba48a4c57747c8085065a106611ac72))
* eliminar layout shifts en tsumego — pastilla PTM muestra resultado y controles/comentario reservan espacio ([51d1152](https://github.com/raultm/engrama/commit/51d115257587b491664b2e4cad422dd11517b436))
* elo diff no desplaza los botones al aparecer ([3351d05](https://github.com/raultm/engrama/commit/3351d052b719c5703a2fe65b84bccbb28450ef69))
* la tarjeta de texto crece con su contenido en lugar de comprimirse ([aa94a08](https://github.com/raultm/engrama/commit/aa94a087fef196b2b63b37860ce1ddf45ea9938e))
* normalizar saltos de línea CRLF en parsers de markdown ([351bb3a](https://github.com/raultm/engrama/commit/351bb3a1a98eac710e14b8f2ab791fa0c4b93d23))
* scroll extra en móvil sin cubrir barra de navegación iOS ([e35098a](https://github.com/raultm/engrama/commit/e35098a583cf590729e1458a7b3e3ddad430f87a))
* variaciones neutrales marcan camino incorrecto + reservar altura en tsumego para evitar layout shifts ([4a64d59](https://github.com/raultm/engrama/commit/4a64d592c828705ad63f9a172e6cae594ec5b771))
