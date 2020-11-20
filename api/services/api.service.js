"use strict";

const _ = require( "lodash" );
const ApiGateway = require( "moleculer-web" );

const { UnAuthorizedError } = ApiGateway.Errors;

module.exports = {
	name: "api",
	
	mixins: [ ApiGateway ],

	settings: {
		port: process.env.PORT || 3000,
		ip: "0.0.0.0",

		routes: [
			{
				path: "/api",
				
				whitelist: [
					"users.*",
					"accounts.*"
				],
				
				// Merge querystring, request params and body parameters
				mergeParams: true,
				
				// Authentication & authorization
				authentication: false,
				authorization: true,
				
				// Generate aliases automatically
				autoAliases: true,
				
				// Calling options for timeout, retries and fallback
				callingOptions: {
					timeout: 1000,
                	retries: 3
				},
				
				// Enable CORS
				cors: true,
				
				// Body parsers
				bodyParsers: {
					json: {
						strict: false,
						limit: "1MB"
					},
					urlencoded: {
						extended: true,
						limit: "1MB"
					}
				},
				
				// Enable all request routes with or without aliases
				mappingPolicy: "all",
				
				// Enable logging
				logging: true
			},
			{
				path: "/upload",
				
				// Enable authorization and disable authentication
				authentication: false,
				authorization: true,
				
				// Define aliases (probably just one)
				aliases: {
					"POST /": "multipart:assets.save"
				},
				
				// Disable body parsers (file uploading)
				bodyParsers: {
					json: false,
					urlencoded: false
				},
				
				// Limit busboy files
				busboyConfig: {
					limits: { files: 1 }
				},
				
				// Enable only request routes with defined aliases
				mappingPolicy: "restrict",
				
				// Enable logging
				logging: true
			}
		],
		
		/**
		 * Uploads will be saved in this folder
		 */
		assets: {
			folder: "public"
		}
	},

	methods: {
		/**
		 * Authorize the request
		 * 
		 * @methods
		 *
		 * @param {Context} ctx
		 * @param {Object} route
		 * @param {IncomingRequest} request
		 * 
		 * @returns {Promise}
		 */
		async authorize( ctx, route, request )
		{
			let token;
			let user;
			
			if ( request.headers.authorization ) {
				const type = request.headers.authorization.split( " " )[ 0 ];
				
				if ( ( type === "Token" ) || ( type === "Bearer" ) ) {
					token = request.headers.authorization.split( " " )[ 1 ];
				}
			}

			if ( token ) {
				try {
					user = await ctx.call( "users.resolveToken", { token } );
					
					if ( user ) {
						ctx.meta.token = token;
						ctx.meta.userID = user._id;
						ctx.meta.user = _.pick( user, [ "_id", "email", "name", "surname", "avatar", "status", "role" ] );
					}
				}
				catch ( err ) { }
			}
			
			if ( request.$action.auth ) {
				const { required, status } = request.$action.auth;
				
				if ( required && ( !user || ( Array.isArray( status ) && !status.includes( user.status ) ) ) ) {
					throw new UnAuthorizedError( );
				}
			}
		}
	}
};