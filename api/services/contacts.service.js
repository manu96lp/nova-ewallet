"use strict";

const DbService = require( "../mixins/db.mixin" );
const CacheCleanerMixin = require( "../mixins/cache.cleaner.mixin" );

const { MoleculerClientError } = require( "moleculer" ).Errors;

module.exports = {
	name: "contacts",
	
	mixins: [
		DbService( "contacts" ),
		CacheCleanerMixin( [
			"cache.clean.users",
			"cache.clean.contacts"
		] )
	],
	
	settings: {
		fields: [ "contact", "alias" ],
		
		populates: {
			"contact": {
				action: "users.get",
				params: {
					fields: [ "_id", "email", "avatar" ]
				}
			}
		},
		
		entityValidator: {
			user: { type: "string" },
			contact: { type: "string" },
			
			alias: { type: "string", min: 2, max: 40 },
			
			createdAt: { type: "date", default: ( ) => new Date( ) },
			updatedAt: { type: "date", default: ( ) => new Date( ) }
		}
	},
	
	actions: {
		/**
		 * Create a new contact
		 *
		 * @actions
		 *
		 * @param {String} user - User that adds the contact
		 * @param {String} contact - User that is added as the contact
		 * @param {String} alias - Alias for identifying the contact
		 * 
		 * @returns {Object} Created contact
		 */
		create: {
			visibility: "public",
			params: {
				user: { type: "string" },
				contact: { type: "string" },
				alias: { type: "string" }
			},
			
			async handler( ctx )
			{
				const { user, contact, alias } = ctx.params;
				const entity = { user, contact, alias };
				
				await this.validateEntity( entity );
				
				const item = await this.findByContactAndUser( user, contact );
				
				if ( item ) {
					throw new MoleculerClientError( "Contact already exists" );
				}
				
				const result = await this.adapter.insert( entity );
				const json = await this.transformDocuments( ctx, { populate: [ "contact" ] }, result );
				
				await this.entityChanged( "created", json, ctx );
				
				return json;
			}
		},
		
		/**
		 * List of contacts
		 *
		 * @actions
		 * 
		 * @param {String} user - User id
		 * @param {Number} limit - Pagination limit
		 * @param {Number} offset - Pagination offset
		 *
		 * @returns {Object} List of contacts
		 */
		list: {
			visibility: "public",
			cache: {
				keys: [ "#userID", "limit", "offset" ]
			},
			params: {
				user: { type: "string" },
				limit: { type: "number" },
				offset: { type: "number" }
			},
			
			async handler( ctx )
			{
				const params = {
					limit: ctx.params.limit,
					offset: ctx.params.offset,
					sort: [ "-createdAt" ],
					populate: [ "contact" ],
					query: {
						user: ctx.params.user
					}
				};
				
				const countParams = Object.assign( { }, params );
				
				delete countParams.limit;
				delete countParams.offset;
				delete countParams.sort;
				delete countParams.populate;

				const res = await this.Promise.all( [
					this.adapter.find( params ),
					this.adapter.count( countParams )
				] );
				
				const jsons = await this.transformDocuments( ctx, params, res[ 0 ] );
				
				return {
					rows: jsons,
					count: res[ 1 ]
				};
			}
		},
		
		/**
		 * Update contact
		 *
		 * @actions
		 *
		 * @param {String} user - User that adds the contact
		 * @param {String} contact - User that is added as the contact
		 * @param {String} alias - Alias for identifying the contact
		 * 
		 * @returns {Object} Contact profile
		 */
		update: {
			visibility: "public",
			params: {
				user: { type: "string" },
				contact: { type: "string" },
				alias: { type: "string" }
			},
			
			async handler( ctx )
			{
				const { user, contact, alias } = ctx.params;
				const entity = { user, contact, alias };
				
				await this.validateEntity( entity );
				
				const item = await this.findByContactAndUser( user, contact );
				
				if ( !item ) {
					throw new MoleculerClientError( "Contact not found" );
				}
				
				const data = {
					"$set": {
						alias,
						updatedAt: new Date( )
					}
				};
				
				const result = await this.adapter.updateById( item._id, data );
				const json = await this.transformDocuments( ctx, { populate: [ "contact" ] }, result );
				
				await this.entityChanged( "updated", json, ctx );
				
				return json;
			}
		},

		/**
		 * Delete an existing contact
		 *
		 * @actions
		 *
		 * @param {String} user - User that has the contact
		 * @param {String} contact - User that is the contact
		 * 
		 * @returns {Object} Deleted contact
		 */
		remove: {
			visibility: "public",
			params: {
				user: { type: "string" },
				contact: { type: "string" }
			},
			
			async handler( ctx )
			{
				const { user, contact } = ctx.params;
				
				const item = await this.findByContactAndUser( user, contact );
				
				if ( !item ) {
					throw new MoleculerClientError( "Contact not found", 404 );
				}
				
				const result = await this.adapter.removeById( item._id );
				const json = await this.transformDocuments( ctx, { populate: [ "contact" ] }, result );
				
				await this.entityChanged( "removed", json, ctx );

				return json;
			}
		}
	},
	
	methods: {
		/**
		 * Find by user and contact
		 * 
		 * @methods
		 * 
		 * @param {String} userId
		 * @param {String} contactId
		 * 
		 * @return {Object} Contact
		 */
		findByContactAndUser( userId, contactId ) {
			const params = {
				query: {
					"$and": [
						{ userId },
						{ contactId }
					]
				}
			};
			
			return this.adapter.findOne( params );
		}
	}
};
