---
name: Spring Boot
description: Fundamentos, REST, JPA, seguridad y testing para construir aplicaciones Java modernas
schedulerType: sm2
---

## ¿Qué es la Inversión de Control (IoC)?

En lugar de que tu código cree sus propias dependencias, es el framework quien las crea y las proporciona. El control del flujo se invierte: no llamas al framework, el framework te llama a ti.

<!-- tags:fundamentos,spring elo:1300 -->

## ¿Qué es la Inyección de Dependencias (DI)?

La forma más común de implementar IoC. Una clase declara qué necesita y Spring se encarga de proporcionarlo. Reduce el acoplamiento y facilita el testing porque puedes sustituir dependencias por mocks.

<!-- tags:fundamentos,spring elo:1300 -->

## ¿Qué es un Bean en Spring?

Un objeto cuyo ciclo de vida gestiona el contenedor de Spring (creación, configuración, destrucción). Cualquier clase anotada con @Component, @Service, @Repository, @Controller o definida con @Bean es un Bean.

<!-- tags:fundamentos,spring elo:1300 -->

## ¿Qué es el ApplicationContext?

El contenedor IoC de Spring. Es responsable de instanciar, configurar y ensamblar todos los Beans. En Spring Boot se crea automáticamente al arrancar la aplicación.

<!-- tags:fundamentos,spring elo:1350 -->

## ¿Qué diferencia hay entre @Component, @Service, @Repository y @Controller?

Todas registran la clase como Bean. La diferencia es semántica y de comportamiento adicional: @Repository convierte excepciones de persistencia, @Controller maneja peticiones web. @Service no añade comportamiento pero documenta la intención.

<!-- tags:anotaciones,fundamentos elo:1350 -->

## ¿Qué hace @Autowired?

Le dice a Spring que inyecte automáticamente el Bean correspondiente en ese campo, constructor o método. En constructores de una sola dependencia, Spring lo aplica sin necesidad de anotarlo explícitamente.

<!-- tags:anotaciones,di elo:1350 -->

## ¿Qué son los scopes de un Bean?

Definen cuántas instancias se crean. Los principales: `singleton` (una instancia por contenedor, por defecto), `prototype` (nueva instancia cada vez que se pide), `request` y `session` (en apps web).

<!-- tags:fundamentos,spring elo:1400 -->

## ¿Qué es mejor: inyección por constructor o por campo?

Por constructor. Hace las dependencias explícitas, permite crear objetos completamente inicializados, facilita el testing sin Spring y detecta dependencias circulares en compilación. La inyección por campo con @Autowired oculta las dependencias.

<!-- tags:di,buenas-practicas elo:1400 -->

## ¿Qué es @Configuration y @Bean?

@Configuration marca una clase como fuente de definiciones de Beans. Los métodos anotados con @Bean dentro de ella devuelven objetos que Spring registra como Beans. Útil para integrar librerías de terceros.

<!-- tags:anotaciones,configuracion elo:1400 -->

## ¿Qué es Spring Boot y qué problema resuelve?

Elimina la configuración XML y el boilerplate de Spring tradicional. Proporciona autoconfiguración, servidores embebidos (Tomcat) y dependencias preconfiguradas (starters). El objetivo: que una app funcione con cero configuración manual.

<!-- tags:springboot,fundamentos elo:1300 -->

## ¿Qué hace @SpringBootApplication?

Es un atajo que combina tres anotaciones: @Configuration (clase de configuración), @EnableAutoConfiguration (activa la autoconfiguración) y @ComponentScan (busca componentes en el paquete actual y subpaquetes).

<!-- tags:springboot,anotaciones elo:1350 -->

## ¿Qué es la autoconfiguración de Spring Boot?

Spring Boot inspecciona el classpath y las propiedades para configurar automáticamente los Beans necesarios. Si detecta H2 en el classpath, configura una base de datos en memoria. Si detecta Spring Security, protege todos los endpoints.

<!-- tags:springboot,autoconfiguracion elo:1400 -->

## ¿Qué son los Spring Boot Starters?

Dependencias predefinidas que agrupan todo lo necesario para una funcionalidad. `spring-boot-starter-web` incluye Tomcat, Spring MVC y Jackson. `spring-boot-starter-data-jpa` incluye Hibernate y Spring Data. Evitan gestionar versiones compatibles.

<!-- tags:springboot,starters elo:1350 -->

## ¿Qué es application.properties / application.yml?

El archivo de configuración principal de Spring Boot. Permite configurar puerto del servidor, conexión a base de datos, niveles de log, propiedades personalizadas, etc. YAML es más legible para configuraciones anidadas.

<!-- tags:springboot,configuracion elo:1350 -->

## ¿Qué son los perfiles (profiles) en Spring Boot?

Permiten tener configuraciones diferentes para cada entorno (dev, test, prod). Se activan con `spring.profiles.active=prod`. Los archivos `application-prod.yml` se cargan sobre el base. Los Beans pueden condicionarse con @Profile.

<!-- tags:springboot,configuracion elo:1400 -->

## ¿Qué es @Value?

Inyecta el valor de una propiedad de configuración directamente en un campo. `@Value("${server.port}")` inyecta el puerto. Para grupos de propiedades relacionadas, @ConfigurationProperties es más limpio y verificable.

<!-- tags:springboot,configuracion elo:1400 -->

## ¿Qué es Spring Boot Actuator?

Añade endpoints de monitorización y gestión a la aplicación: `/actuator/health` (estado), `/actuator/metrics` (métricas), `/actuator/env` (propiedades). Imprescindible en producción. Los endpoints se configuran en application.properties.

<!-- tags:springboot,produccion elo:1450 -->

## ¿Qué es un fat JAR en Spring Boot?

Un JAR que contiene la aplicación, todas sus dependencias y el servidor embebido (Tomcat). Se genera con `mvn package` o `gradle bootJar`. Permite ejecutar la app con un simple `java -jar app.jar` sin instalar nada más.

<!-- tags:springboot,despliegue elo:1400 -->

## ¿Qué es @RestController?

Combina @Controller (registra el Bean como controlador web) y @ResponseBody (serializa automáticamente el retorno de los métodos a JSON). Todos los métodos devuelven datos directamente, no nombres de vistas.

<!-- tags:rest,anotaciones elo:1300 -->

## ¿Qué son @GetMapping, @PostMapping, @PutMapping, @DeleteMapping?

Atajos de @RequestMapping para cada verbo HTTP. `@GetMapping("/users/{id}")` mapea peticiones GET a esa ruta. Equivalen a `@RequestMapping(method = RequestMethod.GET, path = "/users/{id}")`.

<!-- tags:rest,anotaciones elo:1300 -->

## ¿Qué es @PathVariable?

Extrae una parte de la URL como parámetro del método. En `@GetMapping("/users/{id}")`, `@PathVariable Long id` captura el valor de `{id}` de la URL `/users/42`.

<!-- tags:rest,anotaciones elo:1350 -->

## ¿Qué es @RequestParam?

Extrae parámetros de query string. Para `/users?page=2&size=10`, `@RequestParam int page` captura `2`. Puede tener valor por defecto con `defaultValue` y marcarse como no obligatorio con `required = false`.

<!-- tags:rest,anotaciones elo:1350 -->

## ¿Qué es @RequestBody?

Deserializa el cuerpo JSON de la petición HTTP al tipo Java indicado. `@RequestBody CreateUserDto dto` convierte automáticamente el JSON del body a un objeto DTO usando Jackson.

<!-- tags:rest,anotaciones elo:1350 -->

## ¿Qué es ResponseEntity?

Permite controlar completamente la respuesta HTTP: código de estado, cabeceras y cuerpo. `ResponseEntity.created(location).body(user)` devuelve 201 con la URL del recurso creado. Más flexible que devolver el objeto directamente.

<!-- tags:rest,http elo:1400 -->

## ¿Qué es @ControllerAdvice y @ExceptionHandler?

@ControllerAdvice define una clase de manejo global de excepciones. @ExceptionHandler dentro de ella captura un tipo de excepción específico y devuelve una respuesta apropiada. Centraliza el manejo de errores fuera de los controladores.

<!-- tags:rest,errores elo:1450 -->

## ¿Qué es @Valid y la validación de Bean?

@Valid activa la validación de las anotaciones de Bean Validation (`@NotNull`, `@Email`, `@Size`, `@Min`...) sobre el objeto recibido. Si falla, Spring lanza `MethodArgumentNotValidException` antes de entrar al método.

<!-- tags:rest,validacion elo:1450 -->

## ¿Qué es Spring Data JPA?

Capa de abstracción sobre JPA (Hibernate) que elimina el boilerplate de los DAOs. Defines una interfaz que extiende `JpaRepository<Entidad, TipoId>` y Spring genera automáticamente la implementación con los métodos CRUD.

<!-- tags:jpa,datos elo:1350 -->

## ¿Qué métodos proporciona JpaRepository por defecto?

`save()`, `findById()`, `findAll()`, `deleteById()`, `count()`, `existsById()`, entre otros. Todos disponibles sin escribir una sola línea de implementación.

<!-- tags:jpa,datos elo:1350 -->

## ¿Qué son los Query Methods de Spring Data?

Métodos que Spring traduce automáticamente a consultas JPA basándose en el nombre. `findByEmailAndActive(String email, boolean active)` genera el SQL correspondiente sin @Query. Soportan `findBy`, `countBy`, `deleteBy`, `existsBy`.

<!-- tags:jpa,datos elo:1400 -->

## ¿Qué son @Entity, @Table e @Id?

@Entity marca la clase como entidad JPA (tabla en BD). @Table permite configurar el nombre de la tabla. @Id marca el campo como clave primaria. @GeneratedValue configura la estrategia de generación del ID (IDENTITY, SEQUENCE, AUTO).

<!-- tags:jpa,entidades elo:1350 -->

## ¿Qué es @Transactional?

Envuelve el método en una transacción de base de datos. Si el método lanza una excepción no verificada, hace rollback automático. En Spring, los métodos de @Service suelen anotarse con @Transactional para garantizar consistencia.

<!-- tags:jpa,transacciones elo:1400 -->

## ¿Qué es JPQL y @Query?

JPQL es un lenguaje de consultas orientado a objetos (trabaja con entidades, no con tablas). @Query permite definir consultas JPQL o SQL nativo directamente en el repositorio cuando los Query Methods no son suficientes.

<!-- tags:jpa,consultas elo:1450 -->

## ¿Qué es @OneToMany y @ManyToOne?

Definen relaciones entre entidades. @OneToMany (un usuario tiene muchos pedidos) y @ManyToOne (muchos pedidos pertenecen a un usuario). La clave foránea suele vivir en el lado @ManyToOne con @JoinColumn.

<!-- tags:jpa,relaciones elo:1450 -->

## ¿Qué es la carga lazy vs eager en JPA?

LAZY: las entidades relacionadas se cargan solo cuando se accede a ellas (por defecto en @OneToMany). EAGER: se cargan siempre junto con la entidad padre (por defecto en @ManyToOne). LAZY es generalmente preferible para rendimiento.

<!-- tags:jpa,rendimiento elo:1500 -->

## ¿Qué es @SpringBootTest?

Anotación para tests de integración que levanta el contexto completo de Spring. Más lento que los tests unitarios pero verifica que todos los Beans se conectan correctamente. Se combina con @AutoConfigureMockMvc para testear endpoints.

<!-- tags:testing elo:1400 -->

## ¿Qué es MockMvc?

Permite testear controladores REST sin levantar un servidor HTTP real. Simula peticiones HTTP y verifica respuestas: estado, cabeceras, cuerpo JSON. Más rápido que @SpringBootTest con servidor real.

<!-- tags:testing elo:1450 -->

## ¿Qué es @MockBean?

Añade un mock de Mockito al contexto de Spring, sustituyendo el Bean real. Permite testear una capa (ej: controlador) de forma aislada, mockeando sus dependencias (ej: servicio).

<!-- tags:testing elo:1400 -->

## ¿Qué es @WebMvcTest?

Carga solo la capa web (controladores, filtros, serialización). No carga el contexto completo ni la BD. Más rápido que @SpringBootTest. Requiere @MockBean para las dependencias del controlador.

<!-- tags:testing elo:1450 -->

## ¿Qué es @DataJpaTest?

Configura solo la capa de persistencia: repositorios, entidades y una BD en memoria (H2). No carga controladores ni servicios. Ideal para testear repositorios y queries de forma rápida y aislada.

<!-- tags:testing,jpa elo:1450 -->

## ¿Qué es el problema N+1 en JPA?

Ocurre al cargar una lista de entidades y luego acceder a sus relaciones LAZY: se ejecuta 1 query para la lista + N queries individuales (una por entidad). Se resuelve con JOIN FETCH en JPQL, @EntityGraph o configurando EAGER estratégicamente.

<!-- tags:jpa,rendimiento elo:1550 locked:true -->

## ¿Qué es Spring Security?

Framework de autenticación y autorización para aplicaciones Spring. Con spring-boot-starter-security, todos los endpoints quedan protegidos por defecto. Se configura mediante una clase que extiende SecurityFilterChain.

<!-- tags:seguridad elo:1500 -->

## ¿Qué es JWT y cómo se integra con Spring Security?

JSON Web Token: token firmado que contiene claims (usuario, roles, expiración). En Spring Security se añade un filtro que intercepta cada petición, valida el token y establece el contexto de seguridad. Permite autenticación stateless.

<!-- tags:seguridad,jwt elo:1550 locked:true -->

## ¿Qué es CORS y cómo se configura en Spring?

Cross-Origin Resource Sharing: mecanismo que controla qué dominios pueden hacer peticiones a tu API. Se configura con @CrossOrigin en el controlador, o globalmente en el SecurityFilterChain / WebMvcConfigurer para toda la aplicación.

<!-- tags:rest,seguridad elo:1500 -->

## ¿Qué es AOP (Programación Orientada a Aspectos) en Spring?

Permite añadir comportamiento transversal (logging, métricas, seguridad) sin modificar el código de negocio. Se definen Aspects con @Aspect y Advices (@Before, @After, @Around) que se ejecutan cuando se invoca un método que coincide con un Pointcut.

<!-- tags:avanzado,aop elo:1600 locked:true -->

## ¿Qué es @Cacheable en Spring?

Activa el caché para el resultado de un método. La primera llamada ejecuta el método y almacena el resultado; las siguientes devuelven el valor cacheado si la clave coincide. Se combina con @CacheEvict para invalidar el caché.

<!-- tags:avanzado,rendimiento elo:1550 locked:true -->

## ¿Qué son los Spring Events?

Mecanismo de publicación/suscripción interno de Spring. Un componente publica un evento con `ApplicationEventPublisher.publishEvent()` y otros componentes lo reciben con `@EventListener`. Desacopla componentes sin dependencias directas.

<!-- tags:avanzado,arquitectura elo:1600 locked:true -->

## ¿Qué es Flyway y para qué sirve?

Herramienta de migraciones de base de datos. Mantiene un historial de scripts SQL versionados (`V1__create_users.sql`, `V2__add_email.sql`). Al arrancar la app, aplica automáticamente las migraciones pendientes. Garantiza que el esquema esté siempre sincronizado con el código.

<!-- tags:jpa,base-de-datos elo:1500 -->

## ¿Qué diferencia hay entre @Component y @Bean?

@Component es un escaneo automático: Spring detecta la clase anotada en el classpath. @Bean es configuración manual: defines el método en una clase @Configuration y controlas exactamente cómo se crea el objeto. @Bean es necesario para clases de terceros que no puedes anotar.

<!-- tags:fundamentos,anotaciones elo:1400 -->

## ¿Qué es el ciclo de vida de un Bean en Spring?

Instanciación → Inyección de dependencias → @PostConstruct (inicialización personalizada) → Uso → @PreDestroy (limpieza al destruir). @PostConstruct y @PreDestroy son los hooks más comunes para gestionar recursos como conexiones.

<!-- tags:fundamentos,spring elo:1450 -->

## ¿Qué es @ConditionalOnProperty?

Registra un Bean solo si una propiedad de configuración tiene un valor concreto. `@ConditionalOnProperty(name = "feature.payments.enabled", havingValue = "true")` activa el Bean de pagos solo en los entornos donde está configurado. Base del sistema de feature flags de Spring.

<!-- tags:avanzado,autoconfiguracion elo:1600 locked:true -->


## AAAAA

AAAA

<!-- tags:avanzado,autoconfiguracion elo:1600 locked:true -->

## BBBB

BBBB

<!-- tags:avanzado,autoconfiguracion elo:1600 locked:true -->