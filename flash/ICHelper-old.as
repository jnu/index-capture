package {
	import flash.external.ExternalInterface;
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	import flash.net.FileReference;
	import flash.display.MovieClip;
	import org.as3commons.zip.Zip;
	import org.as3commons.zip.ZipFile;
	
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
		
		public function addFile(myName:String="", myData:String=""):void
		{
			ExternalInterface.call('console.log', 'Calling addFile with myName="'+myName+'" and myData of len '+myData.length);
			if( !init )
			{
				toJS(false);
				return;
			}
			myName = prefix + '-' + myName;
			ExternalInterface.call('console.log', "Desired name: "+myName);
			var n:Number = 0;
			ExternalInterface.call('console.log', "n: "+n);
			while( zip.getFileByName(myName) )
			{
				ExternalInterface.call('console.log', "n: "+n);
				// Iterate until a unique name is found: increment
				// n and affix to find a unique name.
				if(n++) myName = myName.substr(0, myName.lastIndexOf('-'));
				myName += '-' + n;
			}
			ExternalInterface.call('console.log', "Using name: "+myName);
			zip.addFileFromString(myName, myData, "utf-8", true);
			ExternalInterface.call('console.log', "File added to zip successfully.");
			toJS(true);
		}
		
		public function generate():void
		{
			if(!init)
			{
				toJS(false);
				return;
			}
			var file = new FileReference();
			var bytes:ByteArray;
			zip.serialize(bytes);
			file.save(bytes, prefix+".zip");
			toJS(true);
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