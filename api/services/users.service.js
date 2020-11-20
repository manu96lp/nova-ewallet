"use strict";

const crypto = require( "crypto" );
const bcrypt = require( "bcrypt" );
const jwt = require( "jsonwebtoken" );

const sendMail = require( "../helpers/email/sender" );
const { verifyAddress, calculateAge, generateRandomKey } = require( "../helpers/common" );

const DbService = require( "../mixins/db.mixin" );
const CacheCleanerMixin = require( "../mixins/cache.cleaner.mixin" );

const { MoleculerClientError } = require( "moleculer" ).Errors;

module.exports = {
	name: "users",
	
	mixins: [
		DbService( "users" ),
		CacheCleanerMixin( [
			"cache.clean.users",
			"cache.clean.contacts",
			"cache.clean.accounts"
		] )
	],
	
	settings: {
		JWT_SECRET: process.env.JWT_SECRET,
		
		fields: [ "_id", "email", "name", "surname", "birthday", "phone", "avatar", "pin", "address", "status" ],
		
		entityValidator: {
			email: { type: "email", max: 48, optional: true },
			password: { type: "string", min: 8, max: 20, optional: true },
			identityNumber: { type: "string", alphanum: true, min: 7, max: 20, optional: true },
			identityType: { type: "enum", values: [ "nid", "passport" ], optional: true },
			name: { type: "string", min: 2, max: 20, optional: true },
			surname: { type: "string", min: 2, max: 20, optional: true },
			birthday: { type: "date", convert: true, optional: true },
			phone: { type: "string", min: 8, max: 20, optional: true },
			avatar: { type: "url", optional: true },
			pin: { type: "string", length: 4, optional: true },
			address: { type: "object", optional: true, props: {
				province: { type: "string" },
				department: { type: "string" },
				locality: { type: "string" },
				street: { type: "string" },
				number: { type: "number", positive: true, convert: true }
			} },
			
			status: { type: "enum", values: [ "pending", "confirmed", "protected", "authorized" ], default: "pending" },
			role: { type: "enum", values: [ "user", "admin" ], default: "user" },
			
			lastLogin: { type: "date", optional: true },
			lastDevice: { type: "string", optional: true },
			lastLocation: { type: "string", optional: true },

			createdAt: { type: "date", default: ( ) => new Date( ) },
			updatedAt: { type: "date", default: ( ) => new Date( ) }
		}
	},
	
	actions: {
		/**
		 * Register a new user
		 *
		 * @actions
		 * 
		 * @param {String} email
		 * @param {String} password
		 *
		 * @returns {Object} Created user
		 */
		create: {
			rest: "POST /register",
			visibility: "published",
			params: {
				email: { type: "email" },
				password: { type: "string" }
			},
			
			async handler( ctx )
			{
				const { email, password } = ctx.params;
				const entity = { email, password };
				
				await this.validateEntity( entity );
				
				const found = await this.adapter.findOne( { email } );
				
				if ( found ) {
					throw new MoleculerClientError( "Email already exists", 422, "", [ { field: "email", message: "already exists" } ] );
				}
				
				entity.password = this.generateHash( password );
				
				const randomKey = generateRandomKey( 6, "numeric" );

				const result = await this.adapter.insert( entity );
				const token = await ctx.call( "tokens.create", { user: result._id.toString( ), token: randomKey, type: "confirmation" } );
				
				const json = await this.transformDocuments( ctx, { }, result );
				const tent = await this.transformEntity( json, true, ctx.meta.token );
				
				await this.entityChanged( "created", tent, ctx );
				
				sendMail( {
					to: email,
					subject: "[Henry Bank] Código de confirmación",
					template: "confirmation",
					input: { code: `${ randomKey.slice( 0, 3 ) } ${ randomKey.slice( 3, 6 ) }` }
				} );
				
				return tent;
			}
		},

		/**
		 * Login with email & password
		 *
		 * @actions
		 * 
		 * @param {String} email - User email
		 * @param {String} password - User password
		 *
		 * @returns {Object} Logged in user with token
		 */
		login: {
			rest: "POST /login",
			visibility: "published",
			params: {
				email: { type: "email" },
				password: { type: "string" }
			},
			
			async handler( ctx )
			{
				const { email, password } = ctx.params;

				const user = await this.adapter.findOne( { email } );
				
				if ( !user ) {
					throw new MoleculerClientError( "Email not found", 422, "", [ { field: "email", message: "not found" } ] );
				}
				
				const equality = await bcrypt.compare( password, user.password );
				
				if ( !equality ) {
					throw new MoleculerClientError( "Incorrect password", 422, "", [ { field: "password", message: "incorrect" } ] );
				}
				
				const json = await this.transformDocuments( ctx, { }, user );
				const tent = this.transformEntity( json, true, ctx.meta.token );
				
				return tent;
			}
		},
		
		/**
		 * Complete a user registration
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {String} 	identityNumber - Identity number
		 * @param {Enum} 	identityType - Nid / Passport
		 * @param {String} 	name - Name
		 * @param {String} 	surname - Surname
		 * @param {Date} 	birthday - Birthday (date)
		 * @param {String} 	phone - Phone number
		 * @param {Object} 	address - Address [province, department, locality, street, number]
		 *
		 * @returns {Object} User entity
		 */
		complete: {
			auth: { required: true, status: [ "confirmed" ] },
			rest: "POST /complete",
			visibility: "published",
			params: {
				identityNumber: { type: "string" },
				identityType: { type: "string" },
				name: { type: "string" },
				surname: { type: "string" },
				birthday: { type: "date", convert: true },
				phone: { type: "string" },
				address: { type: "object" }
			},
			
			async handler( ctx )
			{
				const { identityNumber, identityType, name, surname, birthday, phone, address } = ctx.params;
				const entity = { identityNumber, identityType, name, surname, birthday, phone, address };
				
				await this.validateEntity( entity );
				
				if ( calculateAge( birthday ) < 16 ) {
					throw new MoleculerClientError( "User must be over sixteen years old", 422, "", [ { field: "birthday", message: "younger than 16" } ] );
				}
				
				const userByNid = await this.adapter.findOne( { identityNumber } );
				
				if ( userByNid ) {
					throw new MoleculerClientError( "Identity number already exists", 422, "", [ { field: "identityNumber", message: "already exists" } ] );
				}
				
				if ( ( identityType === "nid" ) && isNaN( identityNumber ) ) {
					throw new MoleculerClientError( "Identity number is invalid", 422, "", [ { field: "identityNumber", message: "invalid" } ] );
				}
				
				if ( address ) {
					const isValid = await verifyAddress( address );
					
					if ( !isValid ) {
						throw new MoleculerClientError( "Invalid address", 422, "", [ { field: "address", message: "invalid" } ] );
					}
				}
				
				const update = {
					"$set": {
						identityNumber,
						identityType,
						name,
						surname,
						birthday,
						phone,
						address,
						status: "authorized"
					}
				};
				
				await ctx.call( "accounts.create", { user: ctx.meta.user._id.toString( ) } );
				
				const result = await this.adapter.updateById( ctx.meta.user._id.toString( ), update );

				const json = await this.transformDocuments( ctx, { }, result );
				const tent = this.transformEntity( json, true, ctx.meta.token );
				
				await this.entityChanged( "updated", tent, ctx );
				
				return tent;
			}
		},

		/**
		 * Verify token
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {String} token
		 */
		verifyToken: {
			auth: { required: true },
			rest: "POST /verify/:token",
			visibility: "published",
			params: {
				token: { type: "string", min: 6, max: 64 }
			},
			
			async handler( ctx )
			{
				const sanitizedToken = ctx.params.token.replace( /\s/g, '' );
				const found = await ctx.call( "tokens.find", { token: sanitizedToken, user: ctx.meta.user._id.toString( ) } );
				
				if ( !found ) {
					throw new MoleculerClientError( "Token not found", 404 );
				}
				
				const nextStatus = {
					confirmation: "confirmed",
					protection: "authorized"
				};
				
				if ( !nextStatus[ found.type ] ) {
					throw new MoleculerClientError( "Invalid token", 409 );
				}
				
				await ctx.call( "tokens.update", { id: found._id.toString( ) } );
				
				const result = await this.adapter.updateById( found.user, { "$set": { status: nextStatus[ found.type ] } } );

				const json = await this.transformDocuments( ctx, { }, result );
				const tent = this.transformEntity( json, false );
				
				await this.entityChanged( "updated", tent, ctx );
			}
		},

		/**
		 * Forgot password (request recovery token)
		 *
		 * @actions
		 * 
		 * @param {String} email
		 */
		forgot: {
			rest: "POST /forgot",
			visibility: "published",
			params: {
				email: { type: "email" }
			},
			
			async handler( ctx )
			{
				const { email } = ctx.params;
				
				const user = await this.adapter.findOne( { email } );
				
				if ( !user ) {
					throw new MoleculerClientError( "Email not found", 422, "", [ { field: "email", message: "not found" } ] );
				}
				
				const token = await ctx.call( "tokens.find", { user: user._id.toString( ), type: "recovery" } );
				 
				if ( token ) {
					throw new MoleculerClientError( "User already requested a token recently", 409 );
				}
				
				const randomKey = generateRandomKey( 64, "alphanumeric" );
				
				await ctx.call( "tokens.create", { user: user._id.toString( ), token: randomKey, type: "recovery" } );
				
				sendMail( {
					to: email,
					subject: "[Henry Bank] Restablecimiento de clave",
					template: "recovery",
					input: {
						name: user.name,
						surname: user.surname,
						code: randomKey
					}
				} );
			}
		},

		/**
		 * Reset password with recovery token
		 *
		 * @actions
		 * 
		 * @param {String} token
		 * @param {String} password
		 */
		reset: {
			rest: "POST /reset/:token",
			visibility: "published",
			params: {
				token: { type: "string", length: 64 },
				password: { type: "string", min: 8, max: 20 }
			},
			
			async handler( ctx )
			{
				const { token, password } = ctx.params;
				const found = await ctx.call( "tokens.find", { token, type: "recovery" } );
				
				if ( !found ) {
					throw new MoleculerClientError( "Token not found", 404 );
				}
				
				await ctx.call( "tokens.update", { id: found._id } );
				
				const hashedPassword = this.generateHash( password );
				
				const result = await this.adapter.updateById( found.user, { "$set": { password: hashedPassword } } );

				const json = await this.transformDocuments( ctx, { }, result );
				const tent = this.transformEntity( json, false );
				
				await this.entityChanged( "updated", tent, ctx );
			}
		},
		
		/**
		 * Get current user entity.
		 * Auth is required
		 *
		 * @actions
		 *
		 * @returns {Object} User entity
		 */
		me: {
			auth: { required: true },
			rest: "GET /me",
			visibility: "published",
			cache: {
				keys: [ "#userID" ]
			},
			
			async handler( ctx )
			{
				const user = await this.getById( ctx.meta.user._id.toString( ) );
				
				if ( !user ) {
					throw new MoleculerClientError( "User not found", 404 );
				}

				const json = await this.transformDocuments( ctx, { }, user );
				const tent = this.transformEntity( json, true, ctx.meta.token );
				
				return tent;
			}
		},

		/**
		 * Update current user
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {String?} phone - Phone number
		 * @param {Url?} avatar - Avatar URL
		 * @param {Object?} address - Address [province, department, locality, street, height]
		 *
		 * @returns {Object} Updated user
		 */
		update: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "PUT /update",
			visibility: "published",
			params: {
				phone: { type: "string", optional: true },
				avatar: { type: "url", optional: true },
				address: { type: "object", optional: true }
			},
			
			async handler( ctx )
			{
				const { address, phone, avatar } = ctx.params;
				
				if ( !address && !phone && !avatar ) {
					throw new MoleculerClientError( "Empty parameters", 400 );
				}
				
				const entity = { address, phone, avatar };
				
				await this.validateEntity( entity );
				
				if ( address ) {
					const res = await verifyAddress( address );
					
					if ( !res ) {
						throw new MoleculerClientError( "Invalid address", 400 );
					}
				}
				
				if ( phone && ( phone.length < 8 ) ) {
					throw new MoleculerClientError( "Invalid phone number", 400 );
				}
				
				const data = {
					"$set": {
						updatedAt: new Date( )
					}
				};
				
				phone && ( data.$set.phone = phone );
				avatar && ( data.$set.avatar = avatar );
				address && ( data.$set.address = address );
				
				const result = await this.adapter.updateById( ctx.meta.user._id.toString( ), data );

				const json = await this.transformDocuments( ctx, { }, result );
				const tent = this.transformEntity( json, true, ctx.meta.token );
				
				await this.entityChanged( "updated", tent, ctx );
				
				return tent;
			}
		},
		
		/**
		 * Get contacts list
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {Number} limit
		 * @param {Number} offset
		 * 
		 * @returns {Array} List of contacts
		 */
		listContacts: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "GET /contacts",
			visibility: "published",
			params: {
				limit: { type: "number", min: 5, max: 50, default: 15, optional: true, convert: true },
				offset: { type: "number", min: 0, default: 0, optional: true, convert: true },
			},
			
			async handler( ctx )
			{
				const list = await ctx.call( "contacts.list", { user: ctx.meta.user._id.toString( ), limit, offset } );
				const profiles = list.rows.map( ( v ) => this.transformProfile( v ) );
				
				return {
					rows: profiles,
					count: list.count
				};
			}
		},

		/**
		 * Add contact
		 * Auth is required
		 *
		 * @actions
		 *
		 * @param {String} email
		 * @param {String} alias
		 *
		 * @returns {Object} Contact profile
		 */
		createContact: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "POST /contacts",
			visibility: "published",
			params: {
				email: { type: "email" },
				alias: { type: "string" }
			},
			
			async handler( ctx )
			{
				const { email, alias } = ctx.params;
				
				const user = await this.adapter.findOne( { email } );
				
				if ( !user ) {
					throw new MoleculerClientError( "User not found", 404 );
				}
				
				const result = await ctx.call( "contacts.create", { user: ctx.meta.user._id.toString( ), contact: user._id.toString( ), alias } );
				const profile = this.transformProfile( result );
				
				return profile;
			}
		},

		/**
		 * Update contact
		 * Auth is required
		 *
		 * @actions
		 *
		 * @param {String} contact
		 * @param {String} alias
		 * 
		 * @returns {Object} Contact profile
		 */
		updateContact: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "PUT /contacts",
			visibility: "published",
			params: {
				contact: { type: "string" },
				alias: { type: "string" }
			},
			
			async handler( ctx )
			{
				const { contact, alias } = ctx.params;
				
				const user = await this.adapter.findById( contact );
				
				if ( !user ) {
					throw new MoleculerClientError( "User not found", 404 );
				}
				
				const result = await ctx.call( "contacts.update", { user: ctx.meta.user._id.toString( ), contact: user._id.toString( ), alias } );
				const profile = this.transformProfile( result );
				
				return profile;
			}
		},

		/**
		 * Remove contact
		 * Auth is required
		 *
		 * @actions
		 *
		 * @param {String} contact
		 * 
		 * @returns {Object} Contact profile
		 */
		removeContact: {
			auth: { required: true, status: [ "authorized" ] },
			rest: "DELETE /contacts",
			visibility: "published",
			params: {
				contact: { type: "string" }
			},
			
			async handler( ctx )
			{
				const user = await this.adapter.findById( ctx.params.contact );
				
				if ( !user ) {
					throw new MoleculerClientError( "User not found", 404 );
				}
				
				const result = await ctx.call( "contacts.remove", { user: ctx.meta.user._id.toString( ), contact: user._id.toString( ) } );
				const profile = this.transformProfile( result );
				
				return profile;
			}
		},
		
		/**
		 * Get user by JWT token
		 *
		 * @actions
		 * 
		 * @param {String} token
		 *
		 * @returns {Object} Resolved user
		 */
		resolveToken: {
			visibility: "public",
			cache: {
				keys: [ "token" ],
				ttl: 3600
			},
			params: {
				token: "string"
			},
			
			async handler( ctx )
			{
				const decoded = await new this.Promise( ( resolve, reject ) => {
					jwt.verify( ctx.params.token, this.settings.JWT_SECRET, ( err, decoded ) => {
						if ( err ) {
							return reject( err );
						}
						
						resolve( decoded );
					} );
				} );

				if ( decoded.id ) {
					return this.getById( decoded.id );
				}
				
				return null;
			}
		},
		
		/**
		 * Change non-redefined moleculer-db actions visibility to "public" in order to protect them from unauthorized access
		 */
		get: { visibility: "public" },
		list: { visibility: "public" },
		remove: { visibility: "public" }
	},
	
	methods: {
		/**
		 * Generate a hash from a password
		 *
		 * @methods
		 *
		 * @param {String} password
		 *
		 * @return {String} Hashed password
		 */
		generateHash( password )
		{
			const salt = bcrypt.genSaltSync( 10 );
			const hash = bcrypt.hashSync( password, salt );
			
			return hash;
		},
		
		/**
		 * Generate a JWT token from user entity
		 *
		 * @methods
		 *
		 * @param {Object} user
		 *
		 * @return {Object} Generated token
		 */
		generateJWT( user )
		{
			const expire = new Date( Date.now( ) + 2592000000 );

			return jwt.sign( {
				id: user._id,
				email: user.email,
				expire
			}, this.settings.JWT_SECRET );
		},

		/**
		 * Transform returned user entity. Generate JWT token if neccessary.
		 *
		 * @methods
		 *
		 * @param {Object} user
		 * @param {Boolean} withToken
		 * @param {String?} token
		 * 
		 * @return {Object} Transformed user
		 */
		transformEntity( user, withToken, token )
		{
			if ( user ) {
				if ( !user.avatar ) {
					const hash = crypto.createHash( "md5" ).update( user.email ).digest( "hex" );
					const url = `https://avatars.dicebear.com/api/avataaars/${ hash }.svg?width=120&height=120`;
					
					user.avatar = url;
				}
				
				if ( withToken ) {
					user.token = token || this.generateJWT( user );
				}
			}

			return { user };
		},

		/**
		 * Transform contact & user entities as profile.
		 *
		 * @methods
		 * 
		 * @param {Object} user
		 * @param {Object} contact
		 * 
		 * @return {Object} Transformed profile
		 */
		transformProfile( { contact, avatar } )
		{
			const profile = {
				...contact,
				avatar
			};

			return { profile };
		}
	}
};