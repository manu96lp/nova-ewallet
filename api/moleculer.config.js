"use strict";

/**
 * Moleculer ServiceBroker configuration file
 *
 * More info about options:
 *     https://moleculer.services/docs/0.14/configuration.html
 *
 *
 * Overwriting options in production:
 * ================================
 * 	You can overwrite any option with environment variables.
 * 	For example to overwrite the "logLevel" value, use `LOGLEVEL=warn` env var.
 * 	To overwrite a nested parameter, e.g. retryPolicy.retries, use `RETRYPOLICY_RETRIES=10` env var.
 *
 * 	To overwrite broker’s deeply nested default options, which are not presented in "moleculer.config.js",
 * 	use the `MOL_` prefix and double underscore `__` for nested properties in .env file.
 * 	For example, to set the cacher prefix to `MYCACHE`, you should declare an env var as `MOL_CACHER__OPTIONS__PREFIX=mycache`.
 *  It will set this:
 *  {
 *    cacher: {
 *      options: {
 *        prefix: "mycache"
 *      }
 *    }
 *  }
 */

module.exports = {
	// Namespace of nodes to segment your nodes on the same network.
	namespace: "henrybank",
	
	// Unique node identifier. Must be unique in a namespace.
	nodeID: null,
	
	// Custom metadata store. Store here what you want.
	metadata: { },

	// Enable/disable logging or use custom logger.
	logger: {
		enabled: true,
		type: "Console",
		options: {
			colors: true,
			moduleColors: false,
			formatter: "full",
			objectPrinter: null,
			autoPadding: false
		}
	},
	
	// Default log level for built-in console logger.
	logLevel: "info",

	// Define transporter. (NATS)
	transporter: null, 

	// Define a cacher. (REDIS)
	cacher: {
		type: "memory",
		options: {
			maxParamsLength: 100
		}
	},

	// Define a serializer.
	serializer: "JSON",

	// Number of milliseconds to wait before reject a request with a RequestTimeout error.
	requestTimeout: ( 10 * 1000 ),

	// Retry policy settings.
	retryPolicy: {
		enabled: false,
		retries: 5,
		delay: 100,
		maxDelay: 1000,
		factor: 2,
		
		check: ( error ) => error && !!error.retryable
	},

	// Limit of calling level. If it reaches the limit, broker will throw an MaxCallLevelError error. (Infinite loop protection)
	maxCallLevel: 100,

	// Number of seconds to send heartbeat packet to other nodes.
	heartbeatInterval: 10,
	
	// Number of seconds to wait before setting node to unavailable status.
	heartbeatTimeout: 30,

	// Cloning the params of context if enabled. High performance impact, use it with caution!
	contextParamsCloning: false,

	// Tracking requests and waiting for running requests before shuting down
	tracking: {
		enabled: false,
		shutdownTimeout: 5000
	},

	// Disable built-in request & emit balancer
	disableBalancer: false,

	// Settings of Service Registry
	registry: {
		strategy: "RoundRobin",
		preferLocal: true
	},

	// Settings of Circuit Breaker
	circuitBreaker: {
		enabled: false,
		threshold: 0.5,
		minRequestCount: 20,
		windowTime: 60,
		halfOpenTime: ( 10 * 1000 ),
		
		check: ( error ) => error && ( error.code >= 500 )
	},

	// Settings of bulkhead feature
	bulkhead: {
		enabled: false,
		concurrency: 10,
		maxQueueSize: 100
	},

	// Enable action & event parameter validation
	validator: true,
	
	// Error handler
	errorHandler: null,

	// Enable/disable built-in metrics function
	metrics: {
		enabled: false,
		reporter: {
			type: "Prometheus",
			options: {
				port: 3030,
				path: "/metrics",
				
				defaultLabels: registry => ( {
					namespace: registry.broker.namespace,
					nodeID: registry.broker.nodeID
				} )
			}
		}
	},

	// Enable built-in tracing function
	tracing: {
		enabled: true,
		exporter: {
			type: "Console",
			options: {
				logger: null,
				colors: true,
				width: 100,
				gaugeWidth: 40
			}
		}
	},

	// Register custom middlewares
	middlewares: [ ],

	// Register custom REPL commands.
	replCommands: null,

	// Called after broker created.
	async created( broker ) {

	},

	// Called after broker started.
	async started( broker ) {

	},

	// Called after broker stopped.
	async stopped( broker ) {

	}
};
