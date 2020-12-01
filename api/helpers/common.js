const fetch = require( "node-fetch" );

/**
 * Verifies an address
 * Address must contain province, department, locality, street and number (height)
 *
 * @param {Object} address
 * 
 * @return {Boolean} True if valid, false otherwise
 */
async function verifyAddress( address )
{
	if ( !address || !address.province || !address.department || !address.locality || !address.street || !address.number ) {
		return false;
	}
	
	let url = "https://apis.datos.gob.ar/georef/api/direcciones?direccion={street} {number}&localidad={locality}&departamento={department}&provincia={province}";
	
	Object.keys( address ).forEach( ( key ) => {
		url = url.replace( `{${ key }}`, address[ key ] );
	} );
	
	try {
		const response = await fetch( url );
		
		if ( !response.ok ) {
			return false;
		}
		
		const data = await response.json( );
		
		if ( !data.cantidad ) {
			return false;
		}
	}
	catch ( error ) { 
		return false;
	}
	
	return true;
}

/**
 * Calculates age based on birthday
 *
 * @param {Date} birthday
 * 
 * @return {Number} Calculated age
 */
function calculateAge( birthday )
{
	const current = new Date( );
	
	const year = current.getYear( ) - birthday.getYear( );
	const month = current.getMonth( ) - birthday.getMonth( );
	const date = current.getDate( ) - birthday.getDate( );
	
	return ( ( month > 0 ) || ( ( month === 0 ) && ( date > 0 ) ) ) ? ( year - 1 ) : year;
}

/**
 * Generate a random key
 *
 * @param {Number} length - Length of the key
 * @param {String} type - Type may be alpha, numeric or alphanumeric
 *
 * @return {String} Generated key
 */
function generateRandomKey( length, type )
{
	if ( !length || !type ) {
		return "";
	}
	
	const types = {
		alpha: { start: 0, limit: 52 },
		numeric: { start: 52, limit: 62 },
		alphanumeric: { start: 0, limit: 62 }
	};
	
	if ( !types[ type ] ) {
		return "";
	}
	
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const result = [ ];
	
	for ( let i = 0 ; i < length ; i++ ) {
		result.push( characters[ types[ type ].start + ( Math.random( ) * ( types[ type ].limit - types[ type ].start ) | 0 ) ] );
	}
	
	return result.join( "" );
}

module.exports = {
	verifyAddress,
	calculateAge,
	generateRandomKey
};