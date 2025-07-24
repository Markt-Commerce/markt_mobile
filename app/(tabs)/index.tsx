import { View, Text, ImageBackground, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const categories = ['All', 'Clothing', 'Electronics', 'Home Decor'];

  const products = [
    {
      title: 'Vintage Leather Jacket',
      price: '$120 · 4.5 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBnC3bfEW7K0VgqJYARGrdV6xhz4-8KeE3srUvQonlPbG4jCYAVQkLQPL6KhZCETl1kQ_2MIUs1QYb8_pK2XDy0P-goLgGg_cdN2qgbGKbKPdNbGhFMAqr-mFU0Up21paSvsyKuykPXxockAm74V_5vemh_JOBgYEReYHZj2zFRKuotcdzKZVxmWuS_6oMFXatNZhn3z5RAZvKDNzFJXylpsrPHCO7GHhiT9qDzX7ovlizHmOmpYUC0W0wqhxdqF0LO62VsQ8wLpA',
    },
    {
      title: 'Wireless Noise-Canceling Headphones',
      price: '$150 · 4.8 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDrIcmp5SR5ldhHV3izWWLQpAxkm-V5A_axsUNWO37wTF8p9Ls8eSP0swqwvjgy9Pm87ciKzWMr4CQr5Guykkg7Isx0kBbujQNBMbHgxLZ0egtJipFVGZQLOeQtjbJiBfei1lcsniU-RODuu3wUdgWg8h3meelpd1JNKBrKaiJd-gdzAi_GUoTo8MPg7Q9-iFIboxcz_ITQ3POVYlT2uSJ6GWOvGaoXRHv0wN7OQfqZK3bG8-74iY0EVqx49GeD8r6O2JgRSWNpqQ',
    },
    {
      title: 'Minimalist Wall Art',
      price: '$45 · 4.2 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBSSdfjiTWO0Vva2yOzVeMHi9zVcgHhE6DZABLviv5B5oN0U-SoFJsVdK4bd1t7X-wr9wymGbS4TU0AWpw6wrvdJNX_kyq1c4kdGnnbSq-oacDsncb-0XD39aCkvdmwnEGzxX2wnV1ohGIRi8IZKZRipyXx5BEtFPkyGx7juYU13AlM1EubOpMumXgo8LsTzZxA0pYTUNLBLP991G656z63Nvvz_nbcB7dQfq8RIGPS16CNnT2FuiJ9_r1GBm6A8KJ8hd9oq56nWw',
    },
    {
      title: 'Organic Cotton T-Shirt',
      price: '$30 · 4.6 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC6psAH6ch1uzqDW2G48J7gasaA_pgP_basUhY5TiUsRuMbBPPG-gcsKRyGo7TvPTR-atNJYGU8Op17qU_YmetzUnysm5xK0Bbz18i6TZQWtO5cmbpt3t9gkc1dmRJsZ8Fjo-yeQYbsEvXe7eKM2OtJ_Z3fHjxX6Wcmb5P5SRO0Gb1wr_36X-vmwjTWrdMrEm3p2jOQcgCJEIjkthnkc60ESDd8LyZEd4J3RHxWU-NePUAoPkJAtmDOJP5tEJ35fViTX20WASHhSA',
    },
    {
      title: 'Smart Home Security Camera',
      price: '$200 · 4.7 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBoyTeLsJXHssWXFjunE4OBHFz0gOXReIM5umxrohERXSykWbTL_cX9Iubmt4qcrhK4dCIN9fZY74NInNlAYBYsfk11ATU3VrYDDuaqvjuTU6Hyd2hKhzBfZ_jxWETfraAyQ2jHNK5BE0KF18UFEWlPEEAusYb4WwjClID9XFIDUy_YRsxRUNQjcQnnyzJLGYZqVB1HOkjC1eQPLEbI4tytCWSMsU7U7WtWPyzI_eJseNu5AxGuJeAdMA3HLd3Fswmh18lnnivspg',
    },
    {
      title: 'Handcrafted Ceramic Vase',
      price: '$60 · 4.9 ★',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA-at7zHhuH3h080HJciA6ZPPgYZwkg3rUZU3fdORc4ZVc-aO18oCaJPn6ll6XkQasa3AEfi7YReqj-Vm9HCHb5GNpKnq9eVfg9Ta9s5gZ7yWUOWc14IP8jOcJTT8NyLWP0-BieqaWXyjoQYhD4eT4OsDBg4Fnub8QJYy4UnbXrRVnqFq10wcFH-OQ0ptV-IU6QYC0kzJXfTt-M1Q89AGEZMVFkSRSMw05NpXiR4JdfmuK1LR3wp1jyTaJv_4NTXByX3lSW6ZCzmA',
    },
  ];

const _layout = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="p-4 pb-2 flex-row justify-between items-center">
        <Text className="flex-1 text-lg font-bold text-center text-[#171311] pl-12">Marketplace</Text>
        <TouchableOpacity className="w-12 h-12 justify-center items-end">
          <Search size={24} color="#171311" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal className="px-3 py-2" showsHorizontalScrollIndicator={false}>
        {categories.map((cat, index) => (
          <View
            key={index}
            className="h-8 px-4 mx-1 rounded-full bg-[#f4f1f0] justify-center items-center"
          >
            <Text className="text-sm font-medium text-[#171311]">{cat}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView className="px-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row flex-wrap justify-between gap-3">
          {products.map((item, idx) => (
            <View key={idx} className="w-[48%] pb-3">
              <ImageBackground
                source={{ uri: item.image }}
                className="aspect-square rounded-xl overflow-hidden"
                resizeMode="cover"
              />
              <Text className="text-base font-medium text-[#171311] mt-2">{item.title}</Text>
              <Text className="text-sm text-[#876d64]">{item.price}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default _layout

const styles = StyleSheet.create({})