//for image upload
import * as ImagePicker from 'expo-image-picker';

export const pickImage = async () : Promise<string | null | undefined> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
    if (permissionResult.granted === false) {
      console.log("Permission to access camera roll is required!");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    return result.assets && result.assets.length > 0 ? result.assets[0].uri : null;
  }