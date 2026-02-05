'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Check, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ErrorLogger from '@/lib/ErrorLogger';

interface ProfilePicture {
    id: string;
    name: string;
    url: string;
    sort_order: number;
}

interface AdminSetting {
    setting_key: string;
    default_value: string;
}

// Fallback pictures if database is empty
const FALLBACK_PICTURES: { name: string; url: string | null }[] = [
    { name: 'Kirby 1', url: 'https://play.nintendo.com/images/profile-kirby-kirby.7bf2a8f2.aead314d58b63e27.png' },
    { name: 'Kirby 2', url: 'https://upload.wikimedia.org/wikipedia/en/4/4e/Kirby_Nintendo.png' },
    { name: 'Kirby 3', url: 'https://img.game8.co/4092785/c895e06343bf482671553caf4e460344.jpeg/show' },
    { name: 'Flamingo', url: 'https://imgcdn.stablediffusionweb.com/2024/3/29/e0396a24-1534-45e4-aa94-9df4dd04c23f.jpg' },
    { name: 'Mark Rutte', url: 'https://www.toonafish.nl/wordpress/wp-content/uploads/2018/03/rutte_big.jpg' },
    { name: 'Mr. Snoeren', url: 'https://pbs.twimg.com/profile_images/576802078120529920/QT5h9-Y4_400x400.jpeg' },
    { name: 'Mr. Kieft', url: 'https://media.licdn.com/dms/image/v2/C4E03AQGv0V0NBMFp2w/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1517750509489?e=2147483647&v=beta&t=1X9PJZxNCMk_BhZKsfbw4gR2Llxnr1bxGl9BLa2FHEg' },
    { name: 'Mr. van Oostveen', url: 'https://images.squarespace-cdn.com/content/v1/65b288af1114ae10e7a459cc/45f6df90-032a-4451-83bc-d8d2794a9ee5/Rene+Profile+Darker.jpeg' },
    { name: 'Hendrikus Colijn', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Hendrik_Colijn_%281925%29.jpg' },
    { name: 'Joe Biden', url: 'https://static.wikia.nocookie.net/house-of-cards/images/9/9d/Joe_Biden_presidential_portrait_%28cropped%29.jpg/revision/latest/scale-to-width-down/1491?cb=20230217225832' },
    { name: 'Donald Trump', url: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29.jpg' },
    { name: 'Barack Obama', url: 'https://static.wikia.nocookie.net/fredonia/images/8/8d/President_Barack_Obama.jpg/revision/latest?cb=20220425034939' },
];

interface ProfilePictureModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAvatarUrl?: string | null;
    onUpdate: () => void;
}

export default function ProfilePictureModal({ isOpen, onClose, currentAvatarUrl, onUpdate }: ProfilePictureModalProps) {
    const { user } = useAuth();
    const [selectedUrl, setSelectedUrl] = useState<string | null>(currentAvatarUrl || null);
    const [saving, setSaving] = useState(false);
    const [hasSelection, setHasSelection] = useState(false);
    const [pictures, setPictures] = useState<{ name: string; url: string | null }[]>([]);
    const [loadingPictures, setLoadingPictures] = useState(true);
    const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);

    // Settings from admin
    const [gridColumns, setGridColumns] = useState(5);
    const [separateDefaults, setSeparateDefaults] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchPictures();
            fetchSettings();
            // Get Google avatar URL from user metadata
            const avatarFromProvider = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
            setGoogleAvatarUrl(avatarFromProvider || null);
        }
    }, [isOpen, user]);

    const fetchSettings = async () => {
        try {
            const { data } = await supabase
                .from('admin_permission_settings')
                .select('setting_key, default_value');

            if (data) {
                data.forEach((setting: AdminSetting) => {
                    if (setting.setting_key === 'ui.profile_pic_columns') {
                        setGridColumns(parseInt(setting.default_value) || 5);
                    }
                    if (setting.setting_key === 'ui.profile_pic_separate_defaults') {
                        setSeparateDefaults(setting.default_value !== 'false');
                    }
                });
            }
        } catch (error) {
            ErrorLogger.error('Error fetching settings:', error);
        }
    };

    const fetchPictures = async () => {
        setLoadingPictures(true);
        try {
            const { data, error } = await supabase
                .from('profile_pictures')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setPictures(data.map((p: ProfilePicture) => ({ name: p.name, url: p.url })));
            } else {
                setPictures(FALLBACK_PICTURES);
            }
        } catch (error) {
            ErrorLogger.error('Error fetching profile pictures:', error);
            setPictures(FALLBACK_PICTURES);
        } finally {
            setLoadingPictures(false);
        }
    };

    if (!isOpen) return null;

    const handleSelect = (url: string | null) => {
        setSelectedUrl(url);
        setHasSelection(true);
    };

    const handleSave = async () => {
        if (!user || !hasSelection) return;

        setSaving(true);
        try {
            const { error } = await (supabase
                .from('profiles') as any)
                .update({ avatar_url: selectedUrl })
                .eq('id', user.id);

            if (error) throw error;

            onUpdate();
            onClose();
        } catch (error) {
            ErrorLogger.error('Error updating profile picture', error);
            alert('Failed to update profile picture');
        } finally {
            setSaving(false);
        }
    };

    // Build display pictures array
    const displayPictures = separateDefaults
        ? pictures
        : [
            { name: 'Default', url: null },
            ...(googleAvatarUrl ? [{ name: 'Google', url: googleAvatarUrl }] : []),
            ...pictures
        ];

 

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Choose Profile Picture</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {loadingPictures ? (
                    <div className="flex-1 flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {/* Separate Default Options (if enabled) */}
                        {separateDefaults && (
                            <>
                                <h3 className="text-sm font-medium text-slate-400 mb-3">Restore Options</h3>
                                <div className="flex gap-3 mb-6">
                                    {/* Default Option */}
                                    <button
                                        onClick={() => handleSelect(null)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${selectedUrl === null && hasSelection
                                            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                                            : 'border-white/10 hover:border-white/30 bg-slate-800/50'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white font-medium text-sm">Default</p>
                                            <p className="text-xs text-slate-400">Use initials</p>
                                        </div>
                                        {selectedUrl === null && hasSelection && (
                                            <Check className="w-4 h-4 text-blue-400 ml-2" />
                                        )}
                                    </button>

                                    {/* Google Option */}
                                    {googleAvatarUrl && (
                                        <button
                                            onClick={() => handleSelect(googleAvatarUrl)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${selectedUrl === googleAvatarUrl && hasSelection
                                                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                                                : 'border-white/10 hover:border-white/30 bg-slate-800/50'
                                                }`}
                                        >
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                                <Image
                                                    src={googleAvatarUrl}
                                                    alt="Google"
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-white font-medium text-sm">Google</p>
                                                <p className="text-xs text-slate-400">From account</p>
                                            </div>
                                            {selectedUrl === googleAvatarUrl && hasSelection && (
                                                <Check className="w-4 h-4 text-blue-400 ml-2" />
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div className="border-t border-white/5 mb-6"></div>
                            </>
                        )}

                        {/* Profile Pictures Grid */}
                        {separateDefaults && (
                            <h3 className="text-sm font-medium text-slate-400 mb-3">Choose from Gallery</h3>
                        )}
                        <div
                            className="grid gap-2 pb-4"
                            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
                        >
                            {displayPictures.map((pic, index) => (
                                <button
                                    key={pic.url || `pic-${index}`}
                                    onClick={() => handleSelect(pic.url)}
                                    className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-150 ${selectedUrl === pic.url && hasSelection
                                        ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-[0.97]'
                                        : 'border-transparent hover:border-white/20 hover:scale-[1.02]'
                                        }`}
                                >
                                    {/* Image */}
                                    <div className="aspect-square w-full relative overflow-hidden bg-slate-800">
                                        {pic.url ? (
                                            <Image
                                                src={pic.url}
                                                alt={pic.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-1/3 h-1/3 text-slate-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Name overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                        <span className="text-xs text-white font-medium px-2 text-center truncate w-full">{pic.name}</span>
                                    </div>

                                    {/* Selection checkmark */}
                                    {selectedUrl === pic.url && hasSelection && (
                                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5 shadow-lg">
                                            <Check size={10} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasSelection}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
