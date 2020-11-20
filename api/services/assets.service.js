"use strict";

const fs = require( "fs" );
const path = require( "path" );

const { generateRandomKey } = require( "../helpers/common" );

const { MoleculerClientError } = require( "moleculer" ).Errors;

module.exports = {
	name: "assets",
	
	actions: {
		/**
		 * Save an uploaded file
		 * Auth is required
		 *
		 * @actions
		 * 
		 * @param {FileStream} - Stream with the contents of the uploaded file
		 *
		 * @returns {String} Saved file name
		 */
		save: {
			auth: { required: true, status: [ "confirmed", "authorized" ] },
			
			handler( ctx )
			{
				const fileExt = ctx.meta.filename.split( "." ).pop( );
				
				if ( ( fileExt !== "png" ) && ( fileExt !== "jpg" ) ) {
					throw new MoleculerClientError( "Invalid file type (must be png or jpg)", 400 );
				}
				
				const randomKey = generateRandomKey( 10, "alphanumeric" );
				
				const fileName = randomKey + "_" + Date.now( ) + "." + fileExt;
				const filePath = path.join( ".", "public", fileName );
				
				try {
					const stream = fs.createWriteStream( filePath );
					
					ctx.params.pipe( stream );
				}
				catch( error ) {
					throw new MoleculerClientError( "Unable to upload file", 500 );
				}
				
				return fileName;
			}
		},
	}
};