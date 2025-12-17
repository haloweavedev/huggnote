"use client";

import { useState } from "react";
import { Lora } from "next/font/google";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loading01Icon, GiftIcon, SparklesIcon, HeartCheckIcon, StarIcon, Tree07Icon } from "hugeicons-react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";

const lora = Lora({ subsets: ["latin"] });

const themes = [
    { value: "merry-christmas", label: "Merry Christmas", description: "Traditional, Festive and Joyful", icon: Tree07Icon },
    { value: "happy-holidays", label: "Happy Holidays", description: "Fun, Happy, Playful", icon: GiftIcon },
    { value: "mistletoe-kisses", label: "Mistletoe Kisses", description: "Romantic or Flirty", icon: HeartCheckIcon },
    { value: "christmas-wish", label: "A Christmas Wish", description: "Loving, Emotional, but Hopeful", icon: StarIcon },
    { value: "happy-new-year", label: "Happy New Year", description: "Celebratory, Hopeful, Fun", icon: SparklesIcon },
    { value: "new-years-wish", label: "New Year's Wish", description: "Emotional, Sentimental, Heartfelt", icon: StarIcon },
];

const vibes = [
    { value: "loving", label: "Loving", description: "All the Feels" },
    { value: "friendly-fun", label: "Friendly/Fun", description: "Lighthearted & Upbeat" },
    { value: "formal", label: "Formal", description: "Best for Acquaintances/Colleagues" },
];

interface SongFormProps {
    index: number;
    title: string;
    onRemove?: () => void;
    canRemove?: boolean;
    namePrefix?: string; // e.g. "songs.0" for nested forms
}

export function SongForm({ index, title, onRemove, canRemove = false, namePrefix = "" }: SongFormProps) {
    const { control } = useFormContext();

    // Helper to get field name: if namePrefix is provided, use it (e.g., songs.0.recipientName), otherwise use flat name
    const getFieldName = (name: string) => namePrefix ? `${namePrefix}.${name}` : name;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Recipient Information Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border-2 border-[#87CEEB]/40 p-6 md:p-8 shadow-[0_8px_30px_rgba(135,206,235,0.3)]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        {/* Optional Subtitle for Bundle Mode */}
                        {namePrefix && (
                            <span className="block text-[#87CEEB] text-lg mb-2">Song {index + 1}</span>
                        )}
                        <h2 className={`text-xl md:text-2xl text-[#E8DCC0] ${lora.className}`}>{title || "Who is this song for?"}</h2>
                    </div>
                    {canRemove && onRemove && (
                        <Button
                            type="button"
                            onClick={onRemove}
                            className="bg-red-500/80 hover:bg-red-600 text-white gap-2"
                        >
                            <Trash2Icon className="w-4 h-4" />
                            <span className="hidden md:inline">Remove</span>
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <FormField
                        control={control}
                        name={getFieldName("recipientName")}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="block text-[#87CEEB] mb-2">Name <span className="text-[#87CEEB]">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Name" className="w-full px-4 py-3 bg-[#0f1e30]/60 border-2 border-[#87CEEB]/40 text-white placeholder-white/50 italic rounded-lg focus:outline-none focus:border-[#F5E6B8] transition-all duration-200 backdrop-blur-sm" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name={getFieldName("recipientNickname")}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="block text-[#87CEEB] mb-2">What do you call them?</FormLabel>
                                <FormControl>
                                    <Input placeholder="Petnames / nicknames etc." className="w-full px-4 py-3 bg-[#0f1e30]/60 border-2 border-[#87CEEB]/40 text-white placeholder-white/50 italic rounded-lg focus:outline-none focus:border-[#F5E6B8] transition-all duration-200 backdrop-blur-sm" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="mt-4 md:mt-6">
                    <FormField
                        control={control}
                        name={getFieldName("relationship")}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="block text-[#87CEEB] mb-2">Relationship <span className="text-[#87CEEB]">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Mum, Dad, Son, Daughter, Girlfriend, Boyfriend..." className="w-full px-4 py-3 bg-[#0f1e30]/60 border-2 border-[#87CEEB]/40 text-white placeholder-white/50 italic rounded-lg focus:outline-none focus:border-[#F5E6B8] transition-all duration-200 backdrop-blur-sm" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="mt-4 md:mt-6">
                    <FormField
                        control={control}
                        name={getFieldName("pronunciation")}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="block text-[#87CEEB] mb-2">Pronunciation</FormLabel>
                                <FormControl>
                                    <Input placeholder="Write phonetically if complicated spelling" className="w-full px-4 py-3 bg-[#0f1e30]/60 border-2 border-[#87CEEB]/40 text-white placeholder-white/50 italic rounded-lg focus:outline-none focus:border-[#F5E6B8] transition-all duration-200 backdrop-blur-sm" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="mt-4 md:mt-6">
                    <FormField
                        control={control}
                        name={getFieldName("senderMessage")}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="block text-[#87CEEB] mb-2">Add a short message <span className="text-[#87CEEB]">*</span></FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="A personal message to accompany your song..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-[#0f1e30]/60 border-2 border-[#87CEEB]/40 text-white placeholder-white/50 italic rounded-lg focus:outline-none focus:border-[#F5E6B8] transition-all duration-200 backdrop-blur-sm resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Theme Selection Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border-2 border-[#87CEEB]/40 p-6 md:p-8 shadow-[0_8px_30px_rgba(135,206,235,0.3)]">
                <FormField
                    control={control}
                    name={getFieldName("theme")}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={`text-xl md:text-2xl mb-6 block text-[#F5E6B8] ${lora.className}`}>Choose a theme <span className="text-[#F5E6B8]">*</span></FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {themes.map((theme) => {
                                        const IconComponent = theme.icon;
                                        return (
                                            <div key={theme.value}
                                                onClick={() => field.onChange(theme.value)}
                                                className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 text-center transform cursor-pointer will-change-transform ${field.value === theme.value
                                                    ? 'border-[#87CEEB] bg-[#87CEEB]/20 shadow-[0_0_30px_rgba(135,206,235,0.8)] scale-105 z-0'
                                                    : 'bg-white/5 backdrop-blur-md border-[#87CEEB]/30 hover:border-[#87CEEB] hover:bg-white/10 hover:scale-[1.02] hover:shadow-lg'
                                                    }`}>
                                                <RadioGroupItem value={theme.value} id={`${getFieldName("theme")}-${theme.value}`} className="sr-only" />
                                                <IconComponent className="w-8 h-8 flex-shrink-0 text-[#87CEEB]" />
                                                <div className="flex-1">
                                                    <div className="mb-1 text-[#F5E6B8] font-medium">{theme.label}</div>
                                                    <div className="text-xs text-[#87CEEB]/80">{theme.description}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* About Them Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border-2 border-[#87CEEB]/40 p-6 md:p-8 shadow-[0_8px_30px_rgba(135,206,235,0.3)] space-y-6">
                <FormField
                    control={control}
                    name={getFieldName("aboutThem")}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={`block text-[#F5E6B8] mb-3 text-lg md:text-2xl ${lora.className}`}>About Them <span className="text-[#F5E6B8]">*</span></FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="What do you admire most about them?"
                                    rows={4}
                                    className="w-full px-4 py-3 bg-[#0f1e30]/60 border-2 border-[#87CEEB]/40 text-white placeholder-white/50 italic rounded-lg focus:outline-none focus:border-[#F5E6B8] transition-all duration-200 backdrop-blur-sm resize-none"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name={getFieldName("moreInfo")}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={`block text-[#E8DCC0] mb-3 text-lg md:text-xl ${lora.className}`}>More Info</FormLabel>
                            <FormControl>
                                <Textarea
                                    {...field}
                                    placeholder="Story, phrase or keywords you want to include"
                                    rows={4}
                                    className="w-full px-4 py-3 bg-[#0f1e30]/60 border-2 border-[#87CEEB]/40 text-white placeholder-white/50 italic rounded-lg focus:outline-none focus:border-[#F5E6B8] transition-all duration-200 backdrop-blur-sm resize-none"
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>

            {/* Musical Preferences Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border-2 border-[#87CEEB]/40 p-6 md:p-8 shadow-[0_8px_30px_rgba(135,206,235,0.3)]">
                <h2 className={`text-[#E8DCC0] mb-6 text-xl md:text-2xl ${lora.className}`}>Musical Preferences <span className="text-[#87CEEB]/70 text-base">(Optional)</span></h2>

                <div className="mb-6">
                    <FormField
                        control={control}
                        name={getFieldName("voiceType")}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="block text-[#87CEEB] mb-3">Voice Type</FormLabel>
                                <FormControl>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {['male', 'female', 'no-preference'].map((type) => (
                                            <div
                                                key={type}
                                                onClick={() => field.onChange(type)}
                                                className={`p-4 rounded-lg border-2 transition-all duration-200 transform cursor-pointer text-center ${field.value === type
                                                    ? 'border-[#87CEEB] bg-[#87CEEB]/20 text-[#F5E6B8]'
                                                    : 'border-[#87CEEB]/30 bg-white/5 hover:border-[#87CEEB]/50 hover:bg-white/10 text-[#F5E6B8]'
                                                    }`}
                                            >
                                                {type === 'no-preference' ? 'No Preference' : `${type.charAt(0).toUpperCase() + type.slice(1)} Voice`}
                                            </div>
                                        ))}
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-6">
                    <FormField
                        control={control}
                        name={getFieldName("genreStyle")}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="block text-[#87CEEB] mb-2">Genre Style</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., Pop, Country, R&B, Acoustic, Jazz, Rock..." className="w-full px-4 py-3 bg-[#0f1e30]/60 border-2 border-[#87CEEB]/40 text-white placeholder-white/50 rounded-lg focus:outline-none focus:border-[#87CEEB] transition-all duration-200 backdrop-blur-sm" />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={getFieldName("instrumentPreferences")}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="block text-[#87CEEB] mb-2">Instrument Preferences</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="e.g., Piano, Guitar, Strings, Upbeat drums..." className="w-full px-4 py-3 bg-[#0f1e30]/60 border-2 border-[#87CEEB]/40 text-white placeholder-white/50 rounded-lg focus:outline-none focus:border-[#87CEEB] transition-all duration-200 backdrop-blur-sm" />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Vibe Selection Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border-2 border-[#87CEEB]/40 p-6 md:p-8 shadow-[0_8px_30px_rgba(135,206,235,0.3)]">
                <FormField
                    control={control}
                    name={getFieldName("vibe")}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={`block text-[#F5E6B8] mb-6 text-xl md:text-2xl ${lora.className}`}>One last thing...select overall vibe? <span className="text-[#F5E6B8]">*</span></FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {vibes.map((vibe) => (
                                        <div
                                            key={vibe.value}
                                            onClick={() => field.onChange(vibe.value)}
                                            className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 transform cursor-pointer ${field.value === vibe.value
                                                ? 'border-[#87CEEB] bg-[#87CEEB]/20 shadow-[0_0_30px_rgba(135,206,235,0.8)] scale-105'
                                                : 'border-[#87CEEB]/30 bg-white/5 hover:border-[#87CEEB] hover:bg-white/10 hover:scale-102'
                                                }`}
                                        >
                                            <div className="text-center mb-2 text-[#F5E6B8] font-medium">{vibe.label}</div>
                                            <div className="text-xs text-[#87CEEB]/70">{vibe.description}</div>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Delivery Speed Selection Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border-2 border-[#87CEEB]/40 p-6 md:p-8 shadow-[0_8px_30px_rgba(135,206,235,0.3)]">
                <FormField
                    control={control}
                    name={getFieldName("deliverySpeed")}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className={`block text-[#F5E6B8] mb-6 text-xl md:text-2xl ${lora.className}`}>Choose Your Delivery Speed</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Standard Option */}
                                    <div
                                        onClick={() => field.onChange('standard')}
                                        className={`flex flex-col p-6 rounded-xl border-2 transition-all duration-200 transform text-left cursor-pointer ${field.value === 'standard' || !field.value
                                                ? 'border-[#87CEEB] bg-[#87CEEB]/20 shadow-[0_8px_30px_rgba(135,206,235,0.5)] scale-105'
                                                : 'border-[#F5E6B8]/30 bg-white/5 hover:border-[#F5E6B8] hover:bg-white/10 hover:scale-102'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-[#87CEEB]">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                            <div className={`text-xl text-white ${lora.className}`}>Standard</div>
                                        </div>
                                        <div className="text-sm text-white/90">Within 24 hours</div>
                                        <div className="mt-2 text-lg text-[#87CEEB]">Included</div>
                                    </div>

                                    {/* Express Option */}
                                    <div
                                        onClick={() => field.onChange('express')}
                                        className={`flex flex-col p-6 rounded-xl border-2 transition-all duration-200 transform text-left cursor-pointer relative ${field.value === 'express'
                                                ? 'border-[#F5E6B8] bg-[#F5E6B8]/20 shadow-[0_8px_30px_rgba(245,230,184,0.5)] scale-105'
                                                : 'border-[#F5E6B8]/30 bg-white/5 hover:border-[#F5E6B8] hover:bg-white/10 hover:scale-102'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-[#F5E6B8]/70">
                                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                            </svg>
                                            <div className={`text-xl text-[#F5E6B8] ${lora.className}`}>Express ⚡</div>
                                        </div>
                                        <div className="text-sm text-[#87CEEB]/80">Within 1 hour</div>
                                        <div className="mt-2 text-lg text-[#F5E6B8]">+€10</div>
                                    </div>
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>


            {/* Divider line between song forms */}
            <div className="py-8">
                <div className="h-px bg-gradient-to-r from-transparent via-[#87CEEB]/30 to-transparent"></div>
            </div>
        </div >
    );
}
