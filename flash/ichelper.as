package {
	import flash.external.ExternalInterface;
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	import flash.net.FileReference;
	import flash.display.MovieClip;
	//import org.as3commons.zip;
	
	public class ICHelper extends MovieClip
	{
		private var zip:Zip;
		private var prefix:String;
		private var init:Boolean = false;
		
		public function ICHelper()
		{
			addCallbacks();
		}
		
		public function create(myPrefix:String="zip"):void
		{
			zip = new Zip();
			prefix = myPrefix;
			init = true;
		}
		
		public function addFile(myName:String="", myData:String=""):Boolean
		{
			if( !init ) return toJS(false);
			myName = prefix + '-' + myName;
			var n:int = 0;
			while( zip.getFileByName(myName)!=null )
			{
				// Iterate until a unique name is found: increment
				// n and affix to find a unique name.
				if(n++) myName = myName.substr(0, myName.lastIndexOf('-'));
				myName += '-' + n;
			}
			zip.addFileFromString(myName, myData);
			return toJS(true);
		}
		
		public function generate():Boolean
		{
			if(!init) return toJS(false);
			var file = new FileReference();
			var bytes:ByteArray;
			zip.serialize(bytes);
			file.save(bytes, prefix+".zip");
			return true;
		}
		
		public function addCallbacks():void
		{
			if( ExternalInterface.available )
			{
				ExternalInterface.addCallback('createZip', create);
				ExternalInterface.addCallback('addFileToZip', addFile);
				ExternalInterface.addCallback('generateZip', generate);
				ExternalInterface.call('console.log', "Flash Zip Helper: Adding callbacks");
			}
		}
		
		public function toJS(status:Object):Object
		{
			// Send something to JavaScript
			if( ExternalInterface.available )
			{
				ExternalInterface.call("fromAS", status);
				return status;
			}
			return null;
		}
	}
}