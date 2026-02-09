/**
 * Base de datos de contenido de lecciones - Física App
 * Cada módulo tiene: teoría (theory) y preguntas (questions)
 * Los módulos se mapean por ID al backend (/content/ruta)
 * nivel_requerido: nivel mínimo del usuario para acceder
 */
window.LessonContentDB = {

    // Módulo 1: Leyes de Newton (Nivel 1)
    1: {
        nivel_requerido: 1,
        xp_recompensa: 50,
        energia_costo: 1,
        theory: [
            {
                title: '¿Qué son las Leyes de Newton?',
                content: 'Las tres leyes de Newton son los principios fundamentales de la mecánica clásica. Describen cómo los objetos se mueven cuando actúan fuerzas sobre ellos. Isaac Newton las publicó en 1687 en su obra "Principia Mathematica".',
                formula: 'F = m × a',
                formulaExplanation: 'La fuerza (F) es igual a la masa (m) multiplicada por la aceleración (a). Esta es la Segunda Ley de Newton.'
            },
            {
                title: 'Primera Ley: Inercia',
                content: 'Un objeto en reposo permanece en reposo, y un objeto en movimiento continúa moviéndose a velocidad constante en línea recta, a menos que una fuerza externa actúe sobre él. Esto se conoce como inercia.',
                formula: 'ΣF = 0 → v = constante',
                formulaExplanation: 'Si la suma de fuerzas es cero, la velocidad no cambia (el objeto mantiene su estado de movimiento).'
            },
            {
                title: 'Tercera Ley: Acción y Reacción',
                content: 'Para cada acción hay una reacción igual y opuesta. Si empujas una pared, la pared te empuja a ti con la misma fuerza pero en dirección contraria.',
                formula: 'F₁₂ = −F₂₁',
                formulaExplanation: 'La fuerza que el objeto 1 ejerce sobre el 2 es igual en magnitud pero opuesta en dirección a la fuerza que el 2 ejerce sobre el 1.'
            }
        ],
        questions: [
            {
                question: 'Según la Segunda Ley de Newton, si aplicas una fuerza de 10N a un objeto de 2kg, ¿cuál es su aceleración?',
                options: ['5 m/s²', '20 m/s²', '12 m/s²', '8 m/s²'],
                correctAnswer: 0,
                explanation: 'F = m × a → a = F/m = 10/2 = 5 m/s²'
            },
            {
                question: '¿Qué establece la Primera Ley de Newton?',
                options: [
                    'Un objeto mantiene su estado de movimiento si no actúa una fuerza externa',
                    'La fuerza es igual a masa por aceleración',
                    'Toda acción tiene una reacción',
                    'Los objetos siempre se detienen solos'
                ],
                correctAnswer: 0,
                explanation: 'La Primera Ley (Inercia) dice que un objeto permanece en su estado de movimiento a menos que una fuerza externa lo cambie.'
            },
            {
                question: 'Si empujas una caja con 50N de fuerza, ¿qué fuerza ejerce la caja sobre ti?',
                options: ['50N en dirección opuesta', '25N en la misma dirección', '100N en dirección opuesta', '0N'],
                correctAnswer: 0,
                explanation: 'Tercera Ley de Newton: la caja ejerce 50N sobre ti en dirección opuesta (acción y reacción).'
            }
        ]
    },

    // Módulo 2: MRU - Problemas Avanzados (Nivel 1)
    2: {
        nivel_requerido: 1,
        xp_recompensa: 60,
        energia_costo: 1,
        theory: [
            {
                title: '¿Qué es el MRU?',
                content: 'El Movimiento Rectilíneo Uniforme (MRU) es aquel en el que un objeto se desplaza en línea recta con velocidad constante. No hay aceleración, por lo que la velocidad no cambia con el tiempo.',
                formula: 'v = d / t',
                formulaExplanation: 'Velocidad (v) = distancia recorrida (d) / tiempo transcurrido (t).'
            },
            {
                title: 'Ecuación de posición del MRU',
                content: 'En el MRU, la posición de un objeto cambia linealmente con el tiempo. Si conoces la posición inicial y la velocidad, puedes calcular dónde estará en cualquier momento.',
                formula: 'x = x₀ + v × t',
                formulaExplanation: 'Posición final (x) = posición inicial (x₀) + velocidad (v) × tiempo (t).'
            }
        ],
        questions: [
            {
                question: 'Un auto viaja a 80 km/h durante 2.5 horas. ¿Qué distancia recorre?',
                options: ['200 km', '160 km', '82.5 km', '32 km'],
                correctAnswer: 0,
                explanation: 'd = v × t = 80 × 2.5 = 200 km'
            },
            {
                question: 'Si un ciclista recorre 30 km en 1.5 horas, ¿cuál es su velocidad?',
                options: ['20 km/h', '45 km/h', '15 km/h', '31.5 km/h'],
                correctAnswer: 0,
                explanation: 'v = d / t = 30 / 1.5 = 20 km/h'
            },
            {
                question: 'Un tren parte de la posición 10 km y viaja a 60 km/h. ¿Dónde estará después de 3 horas?',
                options: ['190 km', '180 km', '70 km', '210 km'],
                correctAnswer: 0,
                explanation: 'x = x₀ + v × t = 10 + 60 × 3 = 10 + 180 = 190 km'
            }
        ]
    },

    // Módulo 3: MRUV - Caída Libre (Nivel 2)
    3: {
        nivel_requerido: 2,
        xp_recompensa: 75,
        energia_costo: 1,
        theory: [
            {
                title: '¿Qué es el MRUV?',
                content: 'El Movimiento Rectilíneo Uniformemente Variado (MRUV) es aquel donde la aceleración es constante. La velocidad cambia de manera uniforme con el tiempo. Un caso especial es la caída libre.',
                formula: 'v = v₀ + a × t',
                formulaExplanation: 'Velocidad final (v) = velocidad inicial (v₀) + aceleración (a) × tiempo (t).'
            },
            {
                title: 'Caída Libre',
                content: 'La caída libre es un caso particular del MRUV donde la única fuerza que actúa es la gravedad. En la Tierra, la aceleración gravitacional es aproximadamente 9.8 m/s² (se usa 10 m/s² para simplificar).',
                formula: 'h = ½ × g × t²',
                formulaExplanation: 'Altura de caída (h) = ½ × gravedad (g ≈ 10 m/s²) × tiempo al cuadrado (t²). Aplica cuando el objeto parte del reposo.'
            },
            {
                title: 'Ecuación de distancia del MRUV',
                content: 'Para calcular la distancia recorrida en MRUV necesitas la velocidad inicial, la aceleración y el tiempo. Esta fórmula es fundamental para resolver problemas de movimiento acelerado.',
                formula: 'd = v₀ × t + ½ × a × t²',
                formulaExplanation: 'Distancia = velocidad inicial × tiempo + ½ × aceleración × tiempo².'
            }
        ],
        questions: [
            {
                question: 'Un objeto cae desde el reposo. ¿Qué velocidad tiene después de 3 segundos? (g = 10 m/s²)',
                options: ['30 m/s', '15 m/s', '45 m/s', '90 m/s'],
                correctAnswer: 0,
                explanation: 'v = v₀ + g × t = 0 + 10 × 3 = 30 m/s'
            },
            {
                question: '¿Qué altura recorre un objeto en caída libre en 2 segundos? (g = 10 m/s²)',
                options: ['20 m', '40 m', '10 m', '5 m'],
                correctAnswer: 0,
                explanation: 'h = ½ × g × t² = ½ × 10 × 4 = 20 m'
            },
            {
                question: 'Un auto frena con aceleración de -5 m/s². Si iba a 20 m/s, ¿en cuánto tiempo se detiene?',
                options: ['4 s', '5 s', '100 s', '2 s'],
                correctAnswer: 0,
                explanation: 'v = v₀ + a×t → 0 = 20 + (-5)×t → t = 20/5 = 4 s'
            },
            {
                question: '¿Qué distancia recorre un auto que parte del reposo con aceleración de 4 m/s² en 5 segundos?',
                options: ['50 m', '20 m', '100 m', '25 m'],
                correctAnswer: 0,
                explanation: 'd = v₀×t + ½×a×t² = 0 + ½×4×25 = 50 m'
            }
        ]
    },

    // Módulo 4: Leyes de Newton - Primera Ley (Nivel 2)
    4: {
        nivel_requerido: 2,
        xp_recompensa: 80,
        energia_costo: 1,
        theory: [
            {
                title: 'Profundizando en la Inercia',
                content: 'La inercia es la resistencia de un objeto a cambiar su estado de movimiento. Cuanto mayor es la masa de un objeto, mayor es su inercia. Un camión necesita más fuerza para frenar que una bicicleta a la misma velocidad.',
                formula: 'Inercia ∝ masa',
                formulaExplanation: 'La inercia es directamente proporcional a la masa del objeto.'
            },
            {
                title: 'Equilibrio de fuerzas',
                content: 'Cuando todas las fuerzas sobre un objeto se cancelan (fuerza neta = 0), el objeto está en equilibrio. Puede estar en reposo (equilibrio estático) o moviéndose a velocidad constante (equilibrio dinámico).',
                formula: 'ΣF = F₁ + F₂ + ... = 0',
                formulaExplanation: 'La suma vectorial de todas las fuerzas actuando sobre el objeto es igual a cero.'
            },
            {
                title: 'Diagramas de cuerpo libre',
                content: 'Un diagrama de cuerpo libre muestra todas las fuerzas que actúan sobre un objeto. Es una herramienta esencial para resolver problemas de mecánica. Se dibujan flechas representando cada fuerza: peso, normal, fricción, tensión, etc.',
                formula: 'N = m × g (en superficie horizontal)',
                formulaExplanation: 'La fuerza normal (N) en una superficie horizontal es igual al peso del objeto: masa × gravedad.'
            }
        ],
        questions: [
            {
                question: '¿Cuál de estos objetos tiene mayor inercia?',
                options: ['Un camión de 10 toneladas', 'Una pelota de tenis', 'Una bicicleta', 'Un libro'],
                correctAnswer: 0,
                explanation: 'El camión tiene mayor masa, por lo tanto mayor inercia (mayor resistencia a cambiar su movimiento).'
            },
            {
                question: 'Un libro reposa sobre una mesa. ¿Qué fuerzas actúan sobre él?',
                options: [
                    'Peso hacia abajo y normal hacia arriba',
                    'Solo el peso hacia abajo',
                    'Solo la normal hacia arriba',
                    'No actúan fuerzas'
                ],
                correctAnswer: 0,
                explanation: 'Actúan el peso (gravedad, hacia abajo) y la fuerza normal (de la mesa, hacia arriba). Se cancelan → equilibrio.'
            },
            {
                question: 'Un objeto de 5 kg está sobre una mesa horizontal. ¿Cuál es la fuerza normal? (g = 10 m/s²)',
                options: ['50 N', '5 N', '100 N', '25 N'],
                correctAnswer: 0,
                explanation: 'N = m × g = 5 × 10 = 50 N (en superficie horizontal, la normal iguala al peso).'
            }
        ]
    },

    // Módulo 5: Trabajo y Energía (Nivel 3)
    5: {
        nivel_requerido: 3,
        xp_recompensa: 90,
        energia_costo: 2,
        theory: [
            {
                title: '¿Qué es el Trabajo en Física?',
                content: 'El trabajo es la transferencia de energía cuando una fuerza mueve un objeto a lo largo de una distancia. Solo hay trabajo si hay desplazamiento en la dirección de la fuerza.',
                formula: 'W = F × d × cos(θ)',
                formulaExplanation: 'Trabajo (W) = Fuerza (F) × distancia (d) × coseno del ángulo (θ) entre la fuerza y el desplazamiento.'
            },
            {
                title: 'Energía Cinética',
                content: 'La energía cinética es la energía que posee un objeto debido a su movimiento. Depende de la masa y la velocidad al cuadrado.',
                formula: 'Ec = ½ × m × v²',
                formulaExplanation: 'Energía cinética = ½ × masa × velocidad al cuadrado.'
            },
            {
                title: 'Energía Potencial Gravitatoria',
                content: 'La energía potencial gravitatoria es la energía almacenada en un objeto debido a su posición en un campo gravitacional. Aumenta con la altura.',
                formula: 'Ep = m × g × h',
                formulaExplanation: 'Energía potencial = masa × gravedad × altura.'
            }
        ],
        questions: [
            {
                question: '¿Cuánto trabajo se realiza al empujar una caja con 100N de fuerza a lo largo de 5 metros?',
                options: ['500 J', '20 J', '105 J', '50 J'],
                correctAnswer: 0,
                explanation: 'W = F × d = 100 × 5 = 500 J (ángulo 0°, cos(0) = 1)'
            },
            {
                question: '¿Cuál es la energía cinética de un objeto de 4 kg que se mueve a 3 m/s?',
                options: ['18 J', '12 J', '36 J', '6 J'],
                correctAnswer: 0,
                explanation: 'Ec = ½ × m × v² = ½ × 4 × 9 = 18 J'
            },
            {
                question: 'Un objeto de 2 kg está a 10 metros de altura. ¿Cuál es su energía potencial? (g = 10 m/s²)',
                options: ['200 J', '20 J', '100 J', '120 J'],
                correctAnswer: 0,
                explanation: 'Ep = m × g × h = 2 × 10 × 10 = 200 J'
            }
        ]
    },

    // Módulo 6: Fricción y Fuerzas (Nivel 3)
    6: {
        nivel_requerido: 3,
        xp_recompensa: 95,
        energia_costo: 2,
        theory: [
            {
                title: 'Fuerza de Fricción',
                content: 'La fricción es una fuerza que se opone al movimiento relativo entre dos superficies en contacto. Puede ser estática (antes del movimiento) o cinética (durante el movimiento).',
                formula: 'f = μ × N',
                formulaExplanation: 'Fuerza de fricción (f) = coeficiente de fricción (μ) × fuerza normal (N).'
            },
            {
                title: 'Plano Inclinado',
                content: 'En un plano inclinado, el peso se descompone en dos componentes: una paralela al plano (que tiende a deslizar el objeto) y una perpendicular (que genera la fuerza normal).',
                formula: 'F∥ = m × g × sen(θ)',
                formulaExplanation: 'Componente del peso paralela al plano = masa × gravedad × seno del ángulo de inclinación.'
            }
        ],
        questions: [
            {
                question: 'Un bloque de 10 kg está sobre una superficie con μ = 0.3. ¿Cuál es la fuerza de fricción? (g = 10 m/s²)',
                options: ['30 N', '3 N', '100 N', '33 N'],
                correctAnswer: 0,
                explanation: 'f = μ × N = μ × m × g = 0.3 × 10 × 10 = 30 N'
            },
            {
                question: '¿Qué tipo de fricción es mayor?',
                options: ['La estática', 'La cinética', 'Son iguales', 'Depende del material'],
                correctAnswer: 0,
                explanation: 'La fricción estática siempre es mayor o igual que la cinética. Se necesita más fuerza para iniciar el movimiento que para mantenerlo.'
            },
            {
                question: 'En un plano inclinado de 30°, ¿cuál es la componente del peso paralela al plano para un objeto de 20 kg? (g = 10, sen30° = 0.5)',
                options: ['100 N', '200 N', '50 N', '173 N'],
                correctAnswer: 0,
                explanation: 'F∥ = m × g × sen(θ) = 20 × 10 × 0.5 = 100 N'
            }
        ]
    },

    // Módulo 7: Momentum e Impulso (Nivel 4)
    7: {
        nivel_requerido: 4,
        xp_recompensa: 100,
        energia_costo: 2,
        theory: [
            {
                title: 'Cantidad de Movimiento (Momentum)',
                content: 'El momentum o cantidad de movimiento es el producto de la masa por la velocidad de un objeto. Es una magnitud vectorial que indica qué tan difícil es detener un objeto en movimiento.',
                formula: 'p = m × v',
                formulaExplanation: 'Momentum (p) = masa (m) × velocidad (v). Se mide en kg·m/s.'
            },
            {
                title: 'Impulso y Conservación del Momentum',
                content: 'El impulso es el cambio en el momentum, igual a la fuerza aplicada por el tiempo. En un sistema cerrado sin fuerzas externas, el momentum total se conserva.',
                formula: 'J = F × Δt = Δp',
                formulaExplanation: 'Impulso (J) = Fuerza × tiempo = cambio de momentum.'
            }
        ],
        questions: [
            {
                question: '¿Cuál es el momentum de un auto de 1000 kg a 20 m/s?',
                options: ['20,000 kg·m/s', '1,020 kg·m/s', '50 kg·m/s', '980 kg·m/s'],
                correctAnswer: 0,
                explanation: 'p = m × v = 1000 × 20 = 20,000 kg·m/s'
            },
            {
                question: 'Una fuerza de 500N actúa durante 0.1 s sobre una pelota. ¿Cuál es el impulso?',
                options: ['50 N·s', '5000 N·s', '500.1 N·s', '5 N·s'],
                correctAnswer: 0,
                explanation: 'J = F × Δt = 500 × 0.1 = 50 N·s'
            },
            {
                question: 'Dos patinadores se empujan. Si uno de 60 kg sale a 2 m/s, ¿a qué velocidad sale el otro de 80 kg?',
                options: ['1.5 m/s', '2 m/s', '2.67 m/s', '1 m/s'],
                correctAnswer: 0,
                explanation: 'Conservación: 0 = 60×2 + 80×(-v) → v = 120/80 = 1.5 m/s'
            }
        ]
    },

    // Módulo 8: Gravitación Universal (Nivel 5)
    8: {
        nivel_requerido: 5,
        xp_recompensa: 120,
        energia_costo: 2,
        theory: [
            {
                title: 'Ley de Gravitación Universal',
                content: 'Newton descubrió que todos los objetos con masa se atraen mutuamente. La fuerza gravitatoria depende de las masas y de la distancia entre ellas. Esta ley explica desde la caída de una manzana hasta las órbitas planetarias.',
                formula: 'F = G × (m₁ × m₂) / r²',
                formulaExplanation: 'F = fuerza gravitatoria, G = 6.67×10⁻¹¹ N·m²/kg², m₁ y m₂ = masas, r = distancia entre centros.'
            },
            {
                title: 'Aceleración Gravitacional',
                content: 'La aceleración gravitacional en la superficie de un planeta depende de su masa y radio. En la Tierra es aproximadamente 9.8 m/s². En la Luna es 1.6 m/s², por eso los astronautas "flotan" al caminar.',
                formula: 'g = G × M / R²',
                formulaExplanation: 'g = aceleración gravitacional, G = constante, M = masa del planeta, R = radio del planeta.'
            }
        ],
        questions: [
            {
                question: 'Si duplicas la distancia entre dos objetos, la fuerza gravitatoria:',
                options: ['Se reduce a 1/4', 'Se reduce a la mitad', 'Se duplica', 'No cambia'],
                correctAnswer: 0,
                explanation: 'F ∝ 1/r². Si r se duplica: F = 1/(2r)² = 1/4 de la original.'
            },
            {
                question: '¿Por qué la gravedad en la Luna es menor que en la Tierra?',
                options: [
                    'Porque la Luna tiene menos masa y menor radio',
                    'Porque la Luna está más lejos del Sol',
                    'Porque no hay atmósfera',
                    'Porque la Luna gira más lento'
                ],
                correctAnswer: 0,
                explanation: 'g = G×M/R². La Luna tiene mucha menos masa, lo que resulta en g = 1.6 m/s² vs 9.8 m/s² de la Tierra.'
            },
            {
                question: 'Si la masa de la Tierra se duplicara pero su radio permaneciera igual, la gravedad en su superficie:',
                options: ['Se duplicaría', 'Se cuadruplicaría', 'No cambiaría', 'Se reduciría a la mitad'],
                correctAnswer: 0,
                explanation: 'g = G×M/R². Si M se duplica y R no cambia, g se duplica.'
            }
        ]
    },

    /**
     * Obtener contenido de lección por módulo ID
     * Intenta del backend primero, luego usa contenido local
     */
    getContenido(moduloId) {
        const id = parseInt(moduloId);
        return this[id] || null;
    },

    /**
     * Obtener todos los módulos disponibles con sus niveles
     */
    getTodosLosModulos() {
        const modulos = [];
        for (let id = 1; id <= 8; id++) {
            if (this[id]) {
                modulos.push({
                    id: id,
                    nivel_requerido: this[id].nivel_requerido,
                    xp_recompensa: this[id].xp_recompensa,
                    energia_costo: this[id].energia_costo,
                    total_teoria: this[id].theory.length,
                    total_preguntas: this[id].questions.length
                });
            }
        }
        return modulos;
    }
};
