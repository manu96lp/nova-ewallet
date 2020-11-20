"use strict";

const DbService = require( "../mixins/db.mixin" );
const CacheCleanerMixin = require( "../mixins/cache.cleaner.mixin" );

const { MoleculerClientError } = require( "moleculer" ).Errors;

module.exports = {
	name: "tokens",
	
	mixins: [
		DbService( "tokens" ),
		CacheCleanerMixin( [
			"cache.clean.users",
			"cache.clean.tokens"
		] )
	],
	
	settings: {
		fields: [ "_id", "user", "token", "type", "used", "expiration", "requested" ],
		
		entityValidator: {
			user: { type: "string" },
			
			token: { type: "string", min: 6, max: 64 },
			type: { type: "enum", values: [ "confirmation", "protection", "recovery" ] },
			used: { type: "boolean", default: false },
			
			expiration: { type: "date", default: ( ) => new Date( Date.now( ) + 900000 ) },
			requested: { type: "date", default: ( ) => new Date( ) }
		}
	},
	
	actions: {
		/**
		 * Create a new token
		 *
		 * @actions
		 * 
		 * @param {String} user - Token user owner (user id)
		 * @param {String} token - Token code
		 * @param {Enum} type - Token type [confirmation, protection, recovery]
		 * @param {Date?} expiration - Token expiration date
		 *	
		 * @returns {Object} Created token's code
		 */
		create: {
			visibility: "public",
			params: {
				user: { type: "string" },
				token: { type: "string" },
				type: { type: "string" },
				expiration: { type: "date", optional: true }
			},
			
			async handler( ctx )
			{
				const { user, token, type, expiration } = ctx.params;
				const entity = { user, token, type, expiration };
				
				await this.validateEntity( entity );
				
				const item = await this.findByParams( { user } );
				
				if ( item && ( item.length > 0 ) ) {
					throw new MoleculerClientError( "User already requested a token recently" );
				}
				
				const result = await this.adapter.insert( entity );
				const json = await this.transformDocuments( ctx, { }, result );
				
				return json;
			}
		},
		
		/**
		 * Find an active token
		 *
		 * @actions
		 * 
		 * @param {String?} token - Token code
		 * @param {String?} type - Token type
		 * @param {String?} user - Token user owner (user id)
		 *	
		 * @returns {Object} Found token
		 */
		find: {
			visibility: "public",
			params: {
				token: { type: "string", min: 6, max: 64, optional: true },
				type: { type: "enum", values: [ "confirmation", "protection", "recovery" ], optional: true },
				user: { type: "string", optional: true }
			},
			
			async handler( ctx )
			{
				const { token, type, user } = ctx.params;
				
				const item = await this.findByParams( { token, type, user } );
				
				if ( !item || !item.length ) {
					return null;
				}
				
				const json = await this.transformDocuments( ctx, { }, item[ 0 ] );
				
				return json;
			}
		},
		
		/**
		 * Update a token (mark it as used)
		 *
		 * @actions
		 * 
		 * @param {String} id - Token id
		 *	
		 * @returns {Object} Updated token
		 */
		update: {
			visibility: "public",
			params: {
				id: { type: "string" }
			},
			
			async handler( ctx )
			{
				const token = await this.adapter.findById( ctx.params.id );
				
				if ( !token ) {
					throw new MoleculerClientError( "Token not found" );
				}
				
				const data = {
					"$set": {
						used: true
					}
				};
				
				const result = await this.adapter.updateById( token._id, data );
				const json = await this.transformDocuments( ctx, { }, result );
				
				await this.entityChanged( "updated", json, ctx );
				
				return json;
			}
		}
	},
	
	methods: {
		/**
		 * Find an active token by code and/or user
		 * 
		 * @methods
		 * 
		 * @param {String?} token - Token code
		 * @param {String?} type - Token type
		 * @param {String?} user - Token owner (user id)
		 * 
		 * @return {Object} Token
		 */
		findByParams( { token, type, user } ) {
			if ( !token && !type && !user ) {
				return null;
			}
			
			const queryParams = [
				{ used: false },
				{ expiration: { "$gt": new Date( ) } }
			];
			
			token && queryParams.push( { token } );
			type && queryParams.push( { type } );
			user && queryParams.push( { user } );
			
			return this.adapter.find( { query: { "$and": queryParams } } );
		}
	}
};