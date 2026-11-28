import pkg from '../package.json' with { type: 'json' };

const openApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'Kizuna Rail API',
        version: pkg.version,
        description: 'API documentation for Kizuna Rail.'
    },
    servers: [{ url: '/' }],
    tags: [
        { name: 'Trains' },
        { name: 'Bookings' },
        { name: 'Users' }
    ],
    paths: {
        '/api/trains': {
            get: {
                tags: ['Trains'],
                summary: 'List trains',
                operationId: 'listTrains',
                responses: {
                    200: {
                        description: 'Trains retrieved successfully.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['trains'],
                                    properties: {
                                        trains: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Train' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/bookings/me': {
            get: {
                tags: ['Bookings'],
                summary: 'List bookings for the signed-in user',
                operationId: 'listMyBookings',
                security: [{ sessionCookie: [] }],
                responses: {
                    200: {
                        description: 'Bookings retrieved successfully.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['bookings'],
                                    properties: {
                                        bookings: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Booking' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    302: { description: 'Redirected to login when not authenticated.' }
                }
            }
        },
        '/api/users': {
            get: {
                tags: ['Users'],
                summary: 'List users with pagination',
                operationId: 'listUsers',
                security: [{ sessionCookie: [] }],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        description: 'One-based page number. Each page contains 10 users.',
                        required: false,
                        schema: {
                            type: 'integer',
                            minimum: 1,
                            default: 1
                        }
                    }
                ],
                responses: {
                    200: {
                        description: 'Users retrieved successfully.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['metadata', 'data'],
                                    properties: {
                                        metadata: {
                                            type: 'object',
                                            required: ['page', 'limit', 'totalItems', 'totalPages'],
                                            properties: {
                                                page: { type: 'integer', example: 1 },
                                                limit: { type: 'integer', example: 10 },
                                                totalItems: { type: 'integer', example: 50 },
                                                totalPages: { type: 'integer', example: 5 }
                                            }
                                        },
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/User' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    302: { description: 'Redirected to login when not authenticated.' },
                    400: {
                        description: 'The page parameter must be a positive integer.',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Error' }
                            }
                        }
                    },
                    403: { description: 'The signed-in user is not an administrator.' }
                }
            }
        }
    },
    components: {
        securitySchemes: {
            sessionCookie: {
                type: 'apiKey',
                in: 'cookie',
                name: 'kizuna_session',
                description: 'Swagger UI sends the current same-origin session cookie automatically. Sign in to the app in this browser first.'
            }
        },
        schemas: {
            Train: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: 'series-e353' },
                    name: { type: 'string', example: 'Series E353 Limited Express' },
                    operator: { type: 'string', example: 'JR East' },
                    imageUrl: { type: 'string' },
                    imageAlt: { type: 'string' },
                    type: { type: 'string' },
                    maxSpeedKmh: { type: 'integer' },
                    capacity: { type: 'integer' },
                    powerSource: { type: 'string' },
                    bestFor: { type: 'string' },
                    description: { type: 'string' }
                }
            },
            Booking: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    selectedDay: { type: 'string', format: 'date' },
                    ticketClass: { type: 'string' },
                    passengers: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                firstName: { type: 'string' },
                                email: { type: 'string', format: 'email' }
                            }
                        }
                    }
                }
            },
            User: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    displayName: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string', enum: ['user', 'admin'] },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Error: {
                type: 'object',
                required: ['error'],
                properties: {
                    error: { type: 'string' }
                }
            }
        }
    }
};

export default openApiDocument;
