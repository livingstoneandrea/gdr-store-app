"use server";

import { ID, Models, Query } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "../appwrite/config";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "../appwrite";
import { getCurrentUser } from "./user.actions";

// import { UploadFileProps } from "@/types";


const handleError = (error: unknown, message: string) => {
    console.log(error, message);

    throw error
}

// eslint-disable-next-line no-undef
export const uploadFile = async ({file, ownerId, accountId,path}: UploadFileProps) => {
    const { databases, storage } = await createAdminClient()

    try {
        const inputFile = InputFile.fromBuffer(file, file.name)

        const bucketFile = await storage.createFile(
            appwriteConfig.buckedId,
            ID.unique(),
            inputFile
        );

        const fileDocument = {
            type: getFileType(bucketFile.name).type,
            name: bucketFile.name,
            url: constructFileUrl(bucketFile.$id),
            extension: getFileType(bucketFile.name).extension,
            size: bucketFile.sizeOriginal,
            owner: ownerId, 
            accountId,
            users: [],
            bucketFileId: bucketFile.$id,
        }

        const newFile = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            ID.unique(),
            fileDocument
        ).catch(async (error: unknown) => {
            await storage.deleteFile(appwriteConfig.buckedId, bucketFile.$id);
            handleError(error, "Failed to create file")
        })

        revalidatePath(path)

        return parseStringify(newFile)

    }catch (error) {
        handleError(error, "Failed to upload file")
    } 
}


const createQueries = (currentUser : Models.Document, types: string[]) => {
    const queries = [
        Query.or([
            Query.equal("owner", [currentUser.$id]),
            Query.contains("users", [currentUser.email])
        ])
    ];
    if (types.length > 0)  queries.push(Query.equal("type", types));

    return queries
}

// eslint-disable-next-line no-undef
export const getFiles = async ({types = []}: GetFilesProps)=> {
    const { databases } = await createAdminClient()
    try {
        const currentUser = await getCurrentUser()

        if(!currentUser) throw new Error("User not found");

        const queries = createQueries(currentUser, types)
        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            queries
        );
        
        return parseStringify(files)

    } catch (error) {
        handleError(error, "Failed to get files")
    }
}

// eslint-disable-next-line no-undef
export const renameFile = async ({fileId, name, extension, path}: RenameFileProps) => {
    const {databases } = await createAdminClient()

    try {
        const newName = `${name}.${extension}`;

        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                name: newName,
            }
        )

        revalidatePath(path)

        return parseStringify(updatedFile)
    } catch (error) {
        handleError(error, "Failed to rename file")
    }
}


// eslint-disable-next-line no-undef
export const updateFileUsers = async ({fileId, emails ,path}: UpdateFileUsersProps) => {
    const { databases } = await createAdminClient()

    try {
        

        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                users: emails,
            }
        )

        revalidatePath(path)

        return parseStringify(updatedFile)
    } catch (error) {
        handleError(error, "Failed to rename file")
    }
}

// eslint-disable-next-line no-undef
export const deleteFile = async ({fileId, bucketFileId ,path}: DeleteFileProps ) => {
    const { databases, storage } = await createAdminClient()

    try {
        

        const deletedFile = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
           
        )
        if(deletedFile){
            await storage.deleteFile(appwriteConfig.buckedId, bucketFileId);
        }


        revalidatePath(path)

        return parseStringify({status: "success"})
    } catch (error) {
        handleError(error, "Failed to rename file")
    }
}